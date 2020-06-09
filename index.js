#!/usr/bin/node

const puppeteer = require('puppeteer');
const fs = require('fs');

function appendSkinParam(url, skin) {
  if (!skin) {
    return url;
  }
  return url + (url.indexOf('?') == -1 ? '?' : '&') + `useskin=${skin}`;
}

function getIterableElementList() {
  const styleMap = [];
  const elements = document.body.getElementsByTagName('*');

  for (let i = 0; i < Object.keys(elements).length; i++) {
    styleMap.push({});
    const styles = window.getComputedStyle(elements[i]);
    for (s of styles) {
      const val = styles.getPropertyValue(s);
      if (!val) continue;
      styleMap[i][s] = val;
    }
    let div = document.createElement('div');
    div.appendChild(elements[i].cloneNode());
    styleMap[i]['representation'] = div.innerHTML;
  }
  return styleMap;
}

async function getStyleMap(url, isMobile) {
  const browser = await puppeteer.launch();

  const page = await browser.newPage();
  await page.setViewport({
    width: isMobile ? 500 : 640,
    height: 480,
    isMobile: isMobile,
  });
  await page.goto(url, opt);
  const styleMap = await page.evaluate(getIterableElementList);
  await browser.close();

  return styleMap;
}

const MAX_CHAR_IN_LINE = 80;
function printDot(success) {
  if (!this.charInLine) this.charInLine = 0;

  process.stdout.write(success ? '.' : 'F');

  if (++this.charInLine > MAX_CHAR_IN_LINE) {
    process.stdout.write('\n');
    this.charInLine = 0;
  }
}

const argv = process.argv.slice(2);
const skinA = argv[0] || 'femiwiki';
const skinB = argv[1] || 'femiwiki0';
console.log(`Compare ${skinA}(A) and ${skinB}(B)`);

const url = 'http://0.0.0.0/';
const pages = [
  'w/%EB%8C%80%EB%AC%B8', // 대문
  'w/%ED%8E%98%EB%AF%B8%EC%9C%84%ED%82%A4:%EB%8C%80%EB%AC%B8', // 페미위키:대문
  'w/%ED%8E%98%EB%AF%B8%EC%9C%84%ED%82%A4', // 페미위키
  'w/Help:%EB%B3%B5%EB%B6%99%EC%9A%A9_%EB%AC%B8%EB%B2%95%ED%91%9C', // 도움말:복붙용 문법표

  'index.php?title=%ED%8E%98%EB%AF%B8%EC%9C%84%ED%82%A4&action=edit', // Edit
  'index.php?title=%ED%8E%98%EB%AF%B8%EC%9C%84%ED%82%A4&action=history', // History
  'index.php?title=%ED%8E%98%EB%AF%B8%EC%9C%84%ED%82%A4&action=info', // Info

  'w/Special:%ED%8A%B9%EC%88%98%EB%AC%B8%EC%84%9C', // 특수:특수문서
  'w/Special:%EA%B2%80%EC%83%89', // 특수:검색
  'w/Special:%EB%B2%84%EC%A0%84', // 특수:버전
  'w/Special:%ED%8E%B8%EC%A7%91%ED%95%84%ED%84%B0', //특수:편집필터
  'w/Special:RecentChanges',
  'w/페미위키?veaction=editsource',
  'w/페미위키?veaction=edit',
  '/index.php?title=대문&oldid=12&unhide=1', // .mw-warning class
  'w/Talk:%EB%8C%80%EB%AC%B8',
];

const opt = {
  waitUntil: ['load', 'domcontentloaded', 'networkidle0'],
};

(async () => {
  let errs = '';

  for (const page of pages) {
    for (const isMobile of [true, false]) {
      let pageErrs = '';
      const urlA = appendSkinParam(url + page, skinA);
      const urlB = appendSkinParam(url + page, skinB);

      const styleMapA = await getStyleMap(urlA, isMobile);
      const styleMapB = await getStyleMap(urlB, isMobile);

      for (let i = 0; i < styleMapA.length; i++) {
        let elementErrs = '';
        for (s in styleMapA[i]) {
          if (
            [
              'width',
              'height',
              'perspective-origin',
              'transform-origin',
            ].indexOf(s) >= 0
          ) {
            continue;
          }
          if (i >= styleMapB.length) {
            elementErrs += `    B does not have ${i}th element\n`;
          } else if (!styleMapB[i].hasOwnProperty(s)) {
            elementErrs += `    A's ${s} is ${styleMapA[i][s]} but B's does not have the property\n`;
          } else if (
            styleMapA[i][s] != styleMapB[i][s] &&
            s != 'representation'
          ) {
            elementErrs += `    A's ${s} is ${styleMapA[i][s]} but B's is ${styleMapB[i][s]}\n`;
          }
        }
        if (
          elementErrs &&
          styleMapA[i] &&
          styleMapA[i].hasOwnProperty('representation') &&
          styleMapB[i] &&
          styleMapB[i].hasOwnProperty('representation')
        ) {
          pageErrs +=
            `  A[${i}] ${styleMapA[i]['representation']}\n` +
            `  B[${i}] ${styleMapB[i]['representation']}\n` +
            elementErrs;
        }
      }
      printDot(!pageErrs);
      if (pageErrs) {
        errs +=
          `A: ${urlA}\nB: ${urlB}\n` +
          (isMobile ? 'On mobile\n' : '') +
          pageErrs;
      }
    }
  }

  process.stdout.write('\n');

  if (errs) {
    fs.writeFile(__dirname + '/report.txt', errs, function (err, data) {
      if (err) {
        return console.log(err);
      }
      console.log('report file is written');
    });
  } else {
    console.log('no error');
  }
})();
