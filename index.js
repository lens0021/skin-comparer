#!/usr/bin/node

const puppeteer = require('puppeteer');
const fs = require('fs');
const CANONICAL_URL = 'http://127.0.0.1/';

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

async function getStyleMap(url, isMobile, login) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(0)
  await page.setViewport({
    width: isMobile ? 500 : 640,
    height: 480,
    isMobile: isMobile,
  });

  if (login) {
    await page.goto(CANONICAL_URL+'w/Special:Login', {
      waitUntil: ['load', 'domcontentloaded', 'networkidle0']
    });
    await page.type('#wpName1', 'Admin');
    await page.type('#wpPassword1', 'admin_password_please_change');
    await Promise.all([
      page.click('#wpLoginAttempt'),
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
    ]);
  }

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

const pages = [
  'index.php?title=대문&oldid=12&unhide=1', // .mw-warning class
  'index.php?title=페미위키&action=edit', // Edit
  'index.php?title=페미위키&action=history', // History
  'index.php?title=페미위키&action=info', // Info
  'w/Help:%EB%B3%B5%EB%B6%99%EC%9A%A9_%EB%AC%B8%EB%B2%95%ED%91%9C', // 도움말:복붙용 문법표
  'w/Special:Abusefilter', //특수:편집필터
  'w/Special:allpages', // 특수:모든문서
  'w/Special:CreateAccount',
  'w/Special:Login',
  'w/Special:Preferences',
  'w/Special:PrefixIndex', // 특수:접두어찾기
  'w/Special:RecentChanges',
  'w/Special:Sanctions', // 특수:제재안목록
  'w/Special:Search', // 특수:검색
  'w/Special:SpecialPages', // 특수:특수문서
  'w/Special:Version', // 특수:버전
  'w/Talk:%EB%8C%80%EB%AC%B8',
  'w/대문', // 대문
  'w/페미위키:대문', // 페미위키:대문
  'w/페미위키?veaction=edit',
  'w/페미위키?veaction=editsource',
  'w/페미위키', // 페미위키

  // 'w/Special:%EA%B0%80%EB%A6%AC%ED%82%A4%EB%8A%94%EB%AC%B8%EC%84%9C', // 특수:가리키는문서
  // 'w/Special:%EA%B0%9C%EC%B2%B4%EB%84%98%EA%B2%A8%EC%A3%BC%EA%B8%B0', // 특수:개체넘겨주기
  // 'w/Special:%EA%B0%9C%EC%B2%B4%EB%8D%B0%EC%9D%B4%ED%84%B0', // 특수:개체데이터
  // 'w/Special:%EA%B0%9C%EC%B2%B4%EB%AC%B8%EC%84%9C', // 특수:개체문서
  // 'w/Special:%EA%B0%9C%EC%B2%B4%EC%82%AC%EC%9A%A9%EB%9F%89', // 특수:개체사용량
  // 'w/Special:%EA%B3%A0%EA%B8%89%EA%B2%80%ED%86%A0%EA%B8%B0%EB%A1%9D', // 특수:고급검토기록
  // 'w/Special:%EA%B3%A0%EC%9C%A0%EB%A7%81%ED%81%AC', // 특수:고유링크
  // 'w/Special:%EA%B5%90%EC%A7%91%ED%95%A9%EB%B6%84%EB%A5%98%EA%B2%80%EC%83%89', // 특수:교집합분류검색
  // 'w/Special:%EA%B5%AC%EC%A1%B0%ED%99%94%EB%90%9C%ED%86%A0%EB%A1%A0', // 특수:구조화된토론
  // 'w/Special:%EA%B6%8C%ED%95%9C%EB%B6%80%EC%97%AC%EB%AA%A9%EB%A1%9D', // 특수:권한부여목록
  // 'w/Special:%EA%B6%8C%ED%95%9C%EC%A1%B0%EC%A0%95', // 특수:권한조정
  // 'w/Special:%EA%B8%B0%EB%A1%9D', // 특수:기록
  // 'w/Special:%EA%B8%B0%EC%97%AC', // 특수:기여
  // 'w/Special:%EA%B8%B4%EB%AC%B8%EC%84%9C', // 특수:긴문서
  // 'w/Special:%EB%81%8A%EA%B8%B4%EB%84%98%EA%B2%A8%EC%A3%BC%EA%B8%B0', // 특수:끊긴넘겨주기
  // 'w/Special:%EB%82%B4%EB%B3%B4%EB%82%B4%EA%B8%B0', // 특수:내보내기
  // 'w/Special:%EB%82%B4%EC%96%B8%EC%96%B4%ED%8F%B4%EB%B0%B1%EC%B2%B4%EC%9D%B8', // 특수:내언어폴백체인
  // 'w/Special:%EB%84%98%EA%B2%A8%EC%A3%BC%EA%B8%B0', // 특수:넘겨주기
  // 'w/Special:%EB%84%98%EA%B2%A8%EC%A3%BC%EA%B8%B0%EB%AA%A9%EB%A1%9D', // 특수:넘겨주기목록
  // 'w/Special:%EB%8B%A4%EB%A9%B4%EB%B6%84%EB%A5%98', // 특수:다면분류
  // 'w/Special:%EB%8D%B0%EC%9D%B4%ED%84%B0%EC%9C%A0%ED%98%95%EB%AA%A9%EB%A1%9D', // 특수:데이터유형목록
  // 'w/Special:%EB%8F%99%EC%9D%8C%EC%9D%B4%EC%9D%98%EC%96%B4%EB%AC%B8%EC%84%9C', // 특수:동음이의어문서
  // 'w/Special:%EB%8F%99%EC%9D%8C%EC%9D%B4%EC%9D%98%EC%96%B4%EB%AC%B8%EC%84%9C%EB%A7%81%ED%81%AC', // 특수:동음이의어문서링크
  // 'w/Special:%EB%A0%88%EC%9D%B4%EB%B8%94%EB%B3%84%ED%95%AD%EB%AA%A9', // 특수:레이블별항목
  // 'w/Special:%EB%A0%88%EC%9D%B4%EB%B8%94%EC%97%86%EB%8A%94%EA%B0%9C%EC%B2%B4', // 특수:레이블없는개체
  // 'w/Special:%EB%A7%81%ED%81%AC%EA%B2%80%EC%83%89', // 특수:링크검색
  // 'w/Special:%EB%A7%81%ED%81%AC%EB%90%9C%EB%AC%B8%EC%84%9C%EB%A1%9C%EA%B0%80%EA%B8%B0', // 특수:링크된문서로가기
  // 'w/Special:%EB%A7%81%ED%81%AC%EC%B5%9C%EA%B7%BC%EB%B0%94%EB%80%9C', // 특수:링크최근바뀜
  // 'w/Special:%EB%A7%89%EB%8B%A4%EB%A5%B8%EB%AC%B8%EC%84%9C', // 특수:막다른문서
  // 'w/Special:%EB%A7%8E%EC%9D%B4%EB%A7%81%ED%81%AC%EB%90%9C%EB%AC%B8%EC%84%9C', // 특수:많이링크된문서
  // 'w/Special:%EB%A7%8E%EC%9D%B4%EB%B6%84%EB%A5%98%EB%90%9C%EB%AC%B8%EC%84%9C', // 특수:많이분류된문서
  // 'w/Special:%EB%A7%8E%EC%9D%B4%EC%93%B0%EB%8A%94%EB%B6%84%EB%A5%98', // 특수:많이쓰는분류
  // 'w/Special:%EB%A7%8E%EC%9D%B4%EC%93%B0%EB%8A%94%ED%8B%80', // 특수:많이쓰는틀
  // 'w/Special:%EB%A7%8E%EC%9D%B4%EC%93%B0%EB%8A%94%ED%8C%8C%EC%9D%BC', // 특수:많이쓰는파일
  // 'w/Special:%EB%A9%94%EC%8B%9C%EC%A7%80%EA%B7%B8%EB%A3%B9%EA%B4%80%EB%A6%AC', // 특수:메시지그룹관리
  // 'w/Special:%EB%A9%94%EC%8B%9C%EC%A7%80%EA%B7%B8%EB%A3%B9%ED%86%B5%EA%B3%84', // 특수:메시지그룹통계
  // 'w/Special:%EB%AA%A8%EB%93%A0%EB%A9%94%EC%8B%9C%EC%A7%80', // 특수:모든메시지
  // 'w/Special:%EB%AC%B8%EC%84%9C%EB%B2%88%EC%97%AD', // 특수:문서번역
  // 'w/Special:%EB%AC%B8%EC%84%9C%EB%B9%84%EA%B5%90', // 특수:문서비교
  // 'w/Special:%EB%AC%B8%EC%A0%9C%EB%B0%94%EB%80%9C', // 특수:문제바뀜
  // 'w/Special:%EB%AF%B8%EB%94%94%EC%96%B4%ED%86%B5%EA%B3%84', // 특수:미디어통계
  // 'w/Special:%EB%B1%83%EC%A7%80%EC%9E%88%EB%8A%94%EB%AC%B8%EC%84%9C', // 특수:뱃지있는문서
  // 'w/Special:%EB%B2%84%EC%A0%84', // 특수:버전
  // 'w/Special:%EB%B2%88%EC%97%AD', // 특수:번역
  // 'w/Special:%EB%B2%88%EC%97%AD%EA%B2%80%EC%83%89', // 특수:번역검색
  // 'w/Special:%EB%B2%88%EC%97%AD%EB%AA%A9%EB%A1%9D', // 특수:번역목록
  // 'w/Special:%EB%B2%88%EC%97%AD%ED%86%B5%EA%B3%84', // 특수:번역통계
  // 'w/Special:%EB%B3%B4%EB%A5%98%EC%A4%91%EB%B0%94%EB%80%9C', // 특수:보류중바뀜
  // 'w/Special:%EB%B3%B4%ED%98%B8%EB%90%9C%EB%AC%B8%EC%84%9C', // 특수:보호된문서
  // 'w/Special:%EB%B4%87%EB%B9%84%EB%B0%80%EB%B2%88%ED%98%B8', // 특수:봇비밀번호
  // 'w/Special:%EB%B6%84%EB%A5%98', // 특수:분류
  // 'w/Special:%EB%B6%84%EB%A5%98%EC%95%88%EB%90%9C%EB%AC%B8%EC%84%9C', // 특수:분류안된문서
  // 'w/Special:%EB%B6%84%EB%A5%98%EC%95%88%EB%90%9C%EB%B6%84%EB%A5%98', // 특수:분류안된분류
  // 'w/Special:%EB%B6%84%EB%A5%98%EC%95%88%EB%90%9C%ED%8B%80', // 특수:분류안된틀
  // 'w/Special:%EB%B6%84%EB%A5%98%EC%95%88%EB%90%9C%ED%8C%8C%EC%9D%BC', // 특수:분류안된파일
  // 'w/Special:%EB%B6%84%EB%A5%98%EC%95%88%EC%9D%98%EC%9E%84%EC%9D%98%EB%AC%B8%EC%84%9C', // 특수:분류안의임의문서
  // 'w/Special:%EB%B6%84%EB%A5%98%ED%8A%B8%EB%A6%AC', // 특수:분류트리
  // 'w/Special:%EB%B9%84%EB%B0%80%EB%B2%88%ED%98%B8%EC%9E%AC%EC%84%A4%EC%A0%95', // 특수:비밀번호재설정
  // 'w/Special:%EB%B9%84%EB%B0%80%EB%B2%88%ED%98%B8%EC%A0%95%EC%B1%85', // 특수:비밀번호정책
  // 'w/Special:%EC%82%AC%EC%9A%A9%EA%B0%80%EB%8A%A5%ED%95%9C%EB%B1%83%EC%A7%80', // 특수:사용가능한뱃지
  // 'w/Special:%EC%82%AC%EC%9A%A9%EC%9E%90%EA%B6%8C%ED%95%9C%EB%AA%A9%EB%A1%9D', // 특수:사용자권한목록
  // 'w/Special:%EC%82%AC%EC%9A%A9%EC%9E%90%EB%AA%A9%EB%A1%9D', // 특수:사용자목록
  // 'w/Special:%EC%82%AC%EC%9D%B4%ED%8A%B8%EB%A7%81%ED%81%AC%EC%97%86%EB%8A%94%EA%B0%9C%EC%B2%B4', // 특수:사이트링크없는개체
  // 'w/Special:%EC%83%88%EB%AC%B8%EC%84%9C', // 특수:새문서
  // 'w/Special:%EC%83%88%EC%86%8D%EC%84%B1', // 특수:새속성
  // 'w/Special:%EC%83%88%ED%8C%8C%EC%9D%BC', // 특수:새파일
  // 'w/Special:%EC%83%88%ED%95%AD%EB%AA%A9', // 특수:새항목
  // 'w/Special:%EC%83%9D%EC%84%B1%EB%B3%B4%ED%98%B8%EB%90%9C%EB%AC%B8%EC%84%9C', // 특수:생성보호된문서
  // 'w/Special:%EC%84%A4%EB%AA%85%EC%97%86%EB%8A%94%EA%B0%9C%EC%B2%B4', // 특수:설명없는개체
  // 'w/Special:%EC%86%8C%EB%8F%84%EA%B5%AC', // 특수:소도구
  // 'w/Special:%EC%86%8D%EC%84%B1%EB%AA%A9%EB%A1%9D', // 특수:속성목록
  // 'w/Special:%EC%86%8D%EC%84%B1%EB%B3%84%EB%AC%B8%EC%84%9C', // 특수:속성별문서
  // 'w/Special:%EC%95%88%EC%93%B0%EB%8A%94%EB%B6%84%EB%A5%98', // 특수:안쓰는분류
  // 'w/Special:%EC%95%88%EC%93%B0%EB%8A%94%ED%8B%80', // 특수:안쓰는틀
  // 'w/Special:%EC%95%88%EC%93%B0%EB%8A%94%ED%8C%8C%EC%9D%BC', // 특수:안쓰는파일
  // 'w/Special:%EC%95%88%EC%A0%95%EB%90%9C%EB%AC%B8%EC%84%9C', // 특수:안정된문서
  // 'w/Special:%EC%95%8C%EB%A6%BC', // 특수:알림
  // 'w/Special:%EC%96%B8%EC%96%B4%ED%86%B5%EA%B3%84', // 특수:언어통계
  // 'w/Special:%EC%97%AD%EC%82%AC%EA%B8%B4%EB%AC%B8%EC%84%9C', // 특수:역사긴문서
  // 'w/Special:%EC%97%AD%EC%82%AC%EC%A7%A7%EC%9D%80%EB%AC%B8%EC%84%9C', // 특수:역사짧은문서
  // 'w/Special:%EC%97%B0%EA%B2%B0%EC%95%88%EB%90%9C%EB%AC%B8%EC%84%9C', // 특수:연결안된문서
  // 'w/Special:%EC%98%A4%EB%9E%98%EB%90%9C%EB%AC%B8%EC%84%9C', // 특수:오래된문서
  // 'w/Special:%EC%99%B8%ED%86%A8%EC%9D%B4%EB%AC%B8%EC%84%9C', // 특수:외톨이문서
  // 'w/Special:%EC%9C%A0%ED%9A%A8%EC%84%B1%ED%86%B5%EA%B3%84', // 특수:유효성통계
  // 'w/Special:%EC%9D%B4%EB%A9%94%EC%9D%BC%EB%B0%94%EA%BE%B8%EA%B8%B0', // 특수:이메일바꾸기
  // 'w/Special:%EC%9D%B4%EB%AC%B8%EC%84%9C%EC%9D%B8%EC%9A%A9', // 특수:이문서인용
  // 'w/Special:%EC%9D%B4%EC%A4%91%EB%84%98%EA%B2%A8%EC%A3%BC%EA%B8%B0', // 특수:이중넘겨주기
  // 'w/Special:%EC%9D%B8%ED%84%B0%EC%9C%84%ED%82%A4', // 특수:인터위키
  // 'w/Special:%EC%9D%B8%ED%84%B0%EC%9C%84%ED%82%A4%EB%A7%8E%EC%9D%80%EB%AC%B8%EC%84%9C', // 특수:인터위키많은문서
  // 'w/Special:%EC%9D%B8%ED%84%B0%EC%9C%84%ED%82%A4%EC%97%86%EB%8A%94%EB%AC%B8%EC%84%9C', // 특수:인터위키없는문서
  // 'w/Special:%EC%9E%84%EC%9D%98%EB%84%98%EA%B2%A8%EC%A3%BC%EA%B8%B0', // 특수:임의넘겨주기
  // 'w/Special:%EC%9E%84%EC%9D%98%EB%AC%B8%EC%84%9C', // 특수:임의문서
  // 'w/Special:%EC%9E%84%EC%9D%98%EC%B5%9C%EC%83%81%EC%9C%84%EB%AC%B8%EC%84%9C', // 특수:임의최상위문서
  // 'w/Special:%EC%9E%90%EA%B2%A9%EC%A6%9D%EB%AA%85%EB%B0%94%EA%BE%B8%EA%B8%B0', // 특수:자격증명바꾸기
  // 'w/Special:%EC%9E%90%EA%B2%A9%EC%A6%9D%EB%AA%85%EC%82%AD%EC%A0%9C', // 특수:자격증명삭제
  // 'w/Special:%EC%9E%90%EB%8F%99%EC%B0%A8%EB%8B%A8%EB%AA%A9%EB%A1%9D', // 특수:자동차단목록
  // 'w/Special:%EC%A0%84%EC%86%A1%ED%86%B5%EA%B3%84', // 특수:전송통계
  // 'w/Special:%EC%A0%9C%EB%AA%A9%EB%B3%84%ED%95%AD%EB%AA%A9', // 특수:제목별항목
  // 'w/Special:%EC%A3%BC%EC%8B%9C%EB%AC%B8%EC%84%9C%EB%AA%A9%EB%A1%9D', // 특수:주시문서목록
  // 'w/Special:%EC%A4%91%EB%B3%B5%EB%90%9C%ED%8C%8C%EC%9D%BC%EB%AA%A9%EB%A1%9D', // 특수:중복된파일목록
  // 'w/Special:%EC%A4%91%EB%B3%B5%ED%8C%8C%EC%9D%BC%EA%B2%80%EC%83%89', // 특수:중복파일검색
  // 'w/Special:%EC%A7%80%EC%9B%90%ED%95%98%EB%8A%94%EC%96%B8%EC%96%B4', // 특수:지원하는언어
  // 'w/Special:%EC%A7%A7%EC%9D%80%EB%AC%B8%EC%84%9C', // 특수:짧은문서
  // 'w/Special:%EC%B0%A8%EB%8B%A8%EB%AA%A9%EB%A1%9D', // 특수:차단목록
  // 'w/Special:%EC%B0%A8%EC%9D%B4', // 특수:차이
  // 'w/Special:%EC%B1%85%EC%B0%BE%EA%B8%B0', // 특수:책찾기
  // 'w/Special:%EC%B5%9C%EA%B7%BC%EB%B0%94%EB%80%9C', // 특수:최근바뀜
  // 'w/Special:%EC%B6%94%EC%A0%81%EC%9A%A9%EB%B6%84%EB%A5%98', // 특수:추적용분류
  // 'w/Special:%EC%BA%A0%ED%8E%98%EC%9D%B8', // 특수:캠페인
  // 'w/Special:%ED%83%9C%EA%B7%B8', // 특수:태그
  // 'w/Special:%ED%86%A0%ED%81%B0%EC%9E%AC%EC%84%A4%EC%A0%95', // 특수:토큰재설정
  // 'w/Special:%ED%86%B5%EA%B3%84', // 특수:통계
  // 'w/Special:%ED%8B%80%EC%97%B0%EC%8A%B5%EC%9E%A5', // 특수:틀연습장
  // 'w/Special:%ED%8B%80%EC%A0%84%EA%B0%9C', // 특수:틀전개
  // 'w/Special:%ED%8C%8C%EC%9D%BC%EB%AA%A9%EB%A1%9D', // 특수:파일목록
  // 'w/Special:%ED%8E%B8%EC%A7%91%ED%95%84%ED%84%B0', // 특수:편집필터
  // 'w/Special:%ED%8E%B8%EC%A7%91%ED%95%84%ED%84%B0%EA%B8%B0%EB%A1%9D', // 특수:편집필터기록
  // 'w/Special:%ED%95%84%EC%9A%94%ED%95%9C%EB%AC%B8%EC%84%9C', // 특수:필요한문서
  // 'w/Special:%ED%95%84%EC%9A%94%ED%95%9C%EB%B6%84%EB%A5%98', // 특수:필요한분류
  // 'w/Special:%ED%95%84%EC%9A%94%ED%95%9C%ED%8B%80', // 특수:필요한틀
  // 'w/Special:%ED%95%84%EC%9A%94%ED%95%9C%ED%8C%8C%EC%9D%BC', // 특수:필요한파일
  // 'w/Special:%ED%95%AD%EB%AA%A9%EB%B3%91%ED%95%A9', // 특수:항목병합
  // 'w/Special:%ED%99%9C%EB%8F%99%EC%A0%81%EC%9D%B8%EC%82%AC%EC%9A%A9%EC%9E%90', // 특수:활동적인사용자
  // 'w/Special:Api%EC%97%B0%EC%8A%B5%EC%9E%A5', // 특수:Api연습장
  // 'w/Special:CollaborationKitIcons', // 특수:CollaborationKitIcons
  // 'w/Special:CreateCollaborationHub', // 특수:CreateCollaborationHub
  // 'w/Special:CreateHubFeature', // 특수:CreateHubFeature
  // 'w/Special:ExportTranslations', // 특수:ExportTranslations
  // 'w/Special:GadgetUsage', // 특수:GadgetUsage
  // 'w/Special:GraphSandbox', // 특수:GraphSandbox
  // 'w/Special:Manage_Two-factor_authentication', // 특수:Manage Two-factor authentication
  // 'w/Special:MIME%EA%B2%80%EC%83%89', // 특수:MIME검색
  // 'w/Special:NewSection', // 특수:NewSection
];

const opt = {
  waitUntil: ['load', 'domcontentloaded', 'networkidle0'],
};

(async () => {
  let errs = '';

  for (const page of pages) {
    for (const login of [true, false]) {
      for (const isMobile of [true, false]) {
        let pageErrs = '';
        const urlA = appendSkinParam(CANONICAL_URL + page, skinA);
        const urlB = appendSkinParam(CANONICAL_URL + page, skinB);

        const styleMapA = await getStyleMap(urlA, isMobile, login);
        const styleMapB = await getStyleMap(urlB, isMobile, login);

        for (let i = 0; i < styleMapA.length; i++) {
          let elementErrs = '';
          for (s in styleMapA[i]) {
            if (
              [
                'width',
                'height',
                'perspective-origin',
                'transform-origin',
              ].indexOf(s) >= 0 ||
              [
                '<img class="ve-ce-chimera ve-ce-chimera-webkit">',
                '<textarea id="wpTextbox1" class="ve-dummyTextbox"></textarea>',
              ].indexOf(styleMapA[i]['representation']) >= 0
            ) {
              continue;
            }
            if (i >= styleMapB.length) {
              elementErrs += `    B does not have ${i}th element\n`;
            } else if (
              styleMapA[i][s] != styleMapB[i][s] &&
              s != 'representation'
            ) {
              continue;
              // elementErrs += `    A's ${s} is ${styleMapA[i][s]} but B's is ${styleMapB[i][s]}\n`;
            } else if (!styleMapB[i].hasOwnProperty(s)) {
              elementErrs += `    A's ${s} is ${styleMapA[i][s]} but B's does not have the property\n`;
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
            (login ? 'Logged in\n' : 'As an anonymous user\n') +
            pageErrs;
        }
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
