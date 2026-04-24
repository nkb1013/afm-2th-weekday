const puppeteer = require('/Users/keumbinoh/Downloads/afm-2th-weekday/week-5/quest/06.shopping-mall/node_modules/puppeteer');
const path = require('path');

const BASE = 'https://01shop-complete.vercel.app';
const DIR = path.join(__dirname, 'screenshots');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // 1. 상품 목록 (쇼핑몰 메인)
  console.log('1. 상품 목록...');
  await page.goto(`${BASE}/shop`, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForSelector('.grid', { timeout: 10000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(DIR, '01-product-list.png'), fullPage: false });
  console.log('   -> 01-product-list.png');

  // 2. 회원가입/로그인 후 장바구니에 담기
  console.log('2. 로그인...');
  // 테스트 계정으로 로그인
  const testEmail = `test-ss-${Date.now()}@test.com`;
  const testPw = 'test1234';
  const testNick = 'screenshot_tester';

  // 회원가입 API 직접 호출
  await page.evaluate(async (email, pw, nick) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pw, nickname: nick }),
    });
    const json = await res.json();
    if (json.success) {
      localStorage.setItem('jachi_token', json.data.token);
    }
  }, testEmail, testPw, testNick);

  // 페이지 리로드하여 로그인 상태 반영
  await page.goto(`${BASE}/shop`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // 상품 담기 (첫 2개)
  console.log('3. 장바구니에 상품 담기...');
  const addButtons = await page.$$('button');
  let addCount = 0;
  for (const btn of addButtons) {
    const text = await btn.evaluate(el => el.textContent);
    if (text.trim() === '담기' && addCount < 2) {
      await btn.click();
      await new Promise(r => setTimeout(r, 800));
      addCount++;
    }
  }

  // 장바구니 이동
  console.log('4. 장바구니 스크린샷...');
  const cartBtn = await page.$('button[class*="relative p-2"]');
  if (cartBtn) await cartBtn.click();
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(DIR, '02-cart.png'), fullPage: false });
  console.log('   -> 02-cart.png');

  // 3. 결제 페이지
  console.log('5. 결제 페이지 스크린샷...');
  const checkoutBtn = await page.evaluateHandle(() => {
    const buttons = document.querySelectorAll('button');
    for (const b of buttons) {
      if (b.textContent.includes('결제하기')) return b;
    }
    return null;
  });
  if (checkoutBtn) {
    await checkoutBtn.click();
    await new Promise(r => setTimeout(r, 4000)); // 위젯 로딩 대기
    await page.screenshot({ path: path.join(DIR, '03-checkout.png'), fullPage: false });
    console.log('   -> 03-checkout.png');
  }

  // 4. 마이페이지 (주문 내역)
  console.log('6. 마이페이지 스크린샷...');
  // 마이페이지 버튼 클릭
  const mypageBtn = await page.evaluateHandle(() => {
    const btns = document.querySelectorAll('button, a');
    for (const b of btns) {
      if (b.textContent.includes('마이페이지')) return b;
    }
    return null;
  });
  if (mypageBtn) {
    await mypageBtn.click();
    await new Promise(r => setTimeout(r, 2000));
  } else {
    // 직접 페이지 상태 변경
    await page.evaluate(() => {
      // 헤더의 마이페이지 버튼을 찾아 클릭
      const links = document.querySelectorAll('button');
      for (const l of links) {
        if (l.textContent.includes('마이페이지')) { l.click(); return; }
      }
    });
    await new Promise(r => setTimeout(r, 2000));
  }
  await page.screenshot({ path: path.join(DIR, '04-mypage.png'), fullPage: false });
  console.log('   -> 04-mypage.png');

  await browser.close();
  console.log('\nDone! Screenshots saved to:', DIR);
})();
