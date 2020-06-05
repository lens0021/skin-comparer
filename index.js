function appendSkinParam(url, skin) {
  if (!skin) {
    return url;
  }
  url += url.indexOf('?') == -1 ? '?' : '&';

  return url + `useskin=${skin}`;
}

function getIterableElementList() {
  const styleMap = [];
  const elements = document.body.getElementsByTagName('*');
  let log = '';

  for (let i = 0; i < Object.keys(elements).length; i++) {
    styleMap.push({});
    const styles = window.getComputedStyle(elements[i]);
    for (s of styles) {
      const val = styles.getPropertyValue(s);
      if (!val) continue;
      styleMap[i][s] = val;
    }
    {
      let tmp = document.createElement('div');
      tmp.appendChild(elements[i].cloneNode());
      styleMap[i]['representation'] = tmp.innerHTML;
    }
  }
  return styleMap;
}

const argv = process.argv.slice(2);
const skinA = argv[0] || 'femiwiki';
const skinB = argv[1] || 'femiwiki0';
console.log(`Compare ${skinA}(A) and ${skinB}(B)`);

const puppeteer = require('puppeteer');

let url = 'http://0.0.0.0/';
// url += 'w/%ED%8E%98%EB%AF%B8%EC%9C%84%ED%82%A4:%EB%8C%80%EB%AC%B8'; // 페미위키:대문
// url += 'w/%ED%8E%98%EB%AF%B8%EC%9C%84%ED%82%A4'; // 페미위키
url += 'w/Help:%EB%B3%B5%EB%B6%99%EC%9A%A9_%EB%AC%B8%EB%B2%95%ED%91%9C'; // 도움말:복붙용 문법표

// url += 'index.php?title=%ED%8E%98%EB%AF%B8%EC%9C%84%ED%82%A4&action=edit'; // Edit
// url += 'index.php?title=%ED%8E%98%EB%AF%B8%EC%9C%84%ED%82%A4&action=history'; // history
// url += 'index.php?title=%ED%8E%98%EB%AF%B8%EC%9C%84%ED%82%A4&action=info'; // info

// url += 'w/Special:%ED%8A%B9%EC%88%98%EB%AC%B8%EC%84%9C'; // 특수:특수문서
// url += 'w/Special:%EA%B2%80%EC%83%89'; // 특수:검색
// url += 'w/Special:%EB%B2%84%EC%A0%84'; // 특수:버전
// url += 'w/Special:%ED%8E%B8%EC%A7%91%ED%95%84%ED%84%B0'; //특수:편집필터
// url += 'w/Special:RecentChanges';
// url += 'w/페미위키?veaction=editsource';
// url += 'w/페미위키?veaction=edit';

let urlA = appendSkinParam(url, skinA);
let urlB = appendSkinParam(url, skinB);
const opt = {
  waitUntil: ['load', 'domcontentloaded', 'networkidle0'],
};
console.log(`A: ${urlA}\nB: ${urlB}`);

(async () => {
  const browser = await puppeteer.launch();

  const pageA = await browser.newPage();
  const pageB = await browser.newPage();
  await pageA.goto(urlA, opt);
  await pageB.goto(urlB, opt);

  let styleMapA = await pageA.evaluate(getIterableElementList);
  let styleMapB = await pageB.evaluate(getIterableElementList);

  for (let i = 0; i < styleMapA.length; i++) {
    // if (
    //   styleMapA[i].hasOwnProperty('display') &&
    //   styleMapA[i]['display'] == 'none'
    // ) {
    //   continue;
    // }
    let same = true;
    for (s in styleMapA[i]) {
      if (i >= styleMapB.length) {
        console.log(`B does not have ${i}th element`);
        same = false;
      } else if (!styleMapB[i].hasOwnProperty(s)) {
        console.log(
          `A's ${i}th element's ${s} is ${styleMapA[i][s]} but B's does not have the property`
        );
        same = false;
      } else if (
        styleMapA[i][s] != styleMapB[i][s] &&
        s != 'representation' &&
        s != 'height' &&
        s != 'perspective-origin' &&
        s != 'transform-origin'
      ) {
        console.log(
          `A's ${i}th element's ${s} is ${styleMapA[i][s]} but B's is ${styleMapB[i][s]}`
        );
        same = false;
      }
    }
    if (
      !same &&
      styleMapA[i].hasOwnProperty('representation') &&
      styleMapB[i].hasOwnProperty('representation')
    ) {
      console.log(`element(A) is ${styleMapA[i]['representation']}`);
      console.log(`element(B) is ${styleMapB[i]['representation']}`);
    }
  }

  await browser.close();
})();
