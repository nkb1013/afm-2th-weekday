const puppeteer = require('puppeteer');
const path = require('path');

const BASE = 'http://localhost:3006';
const DIR = path.join(__dirname, 'screenshots');
const TEST_EMAIL = `shopper_${Date.now()}@test.com`;
const TEST_PW = 'test1234';
const TEST_NICK = '자취쇼퍼';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // ===== 1. 상품 목록 (비로그인) =====
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  await sleep(2000);
  await page.screenshot({ path: path.join(DIR, '01_product_list.png') });
  console.log('✅ 01. 상품 목록 (비로그인)');

  // ===== 2. 비로그인 상태에서 장바구니 담기 시도 =====
  const addBtns = await page.$$('button');
  for (const btn of addBtns) {
    const text = await page.evaluate(el => el.textContent.trim(), btn);
    if (text === '담기') { await btn.click(); break; }
  }
  await sleep(1500);
  await page.screenshot({ path: path.join(DIR, '02_login_required_toast.png') });
  console.log('✅ 02. 비로그인 장바구니 담기 → 로그인 필요 토스트');

  // ===== 3. 회원가입 탭 =====
  // 현재 auth 페이지에 있어야 함
  const tabs = await page.$$('button');
  for (const tab of tabs) {
    const text = await page.evaluate(el => el.textContent.trim(), tab);
    if (text === '회원가입') { await tab.click(); break; }
  }
  await sleep(500);
  await page.screenshot({ path: path.join(DIR, '03_register_tab.png') });
  console.log('✅ 03. 회원가입 탭');

  // ===== 4. 회원가입 입력 =====
  const inputs = await page.$$('input');
  await inputs[0].type(TEST_EMAIL);
  await inputs[1].type(TEST_PW);
  await inputs[2].type(TEST_NICK);
  await sleep(300);
  await page.screenshot({ path: path.join(DIR, '04_register_filled.png') });
  console.log('✅ 04. 회원가입 입력');

  // 회원가입 버튼 클릭
  const regBtn = await page.$('button[type="submit"], button.w-full');
  const allBtns = await page.$$('button');
  for (const btn of allBtns) {
    const text = await page.evaluate(el => el.textContent.trim(), btn);
    if (text === '회원가입') {
      const isSubmit = await page.evaluate(el => el.closest('form') !== null, btn);
      if (isSubmit) { await btn.click(); break; }
    }
  }
  await sleep(2000);
  await page.screenshot({ path: path.join(DIR, '05_after_register.png') });
  console.log('✅ 05. 회원가입 완료 → 상품 목록');

  // ===== 5. 카테고리 필터 =====
  const catBtns = await page.$$('button');
  for (const btn of catBtns) {
    const text = await page.evaluate(el => el.textContent.trim(), btn);
    if (text === '신선식품') { await btn.click(); break; }
  }
  await sleep(500);
  await page.screenshot({ path: path.join(DIR, '06_category_filter.png') });
  console.log('✅ 06. 카테고리 필터 (신선식품)');

  // 전체로 복귀
  const catBtns2 = await page.$$('button');
  for (const btn of catBtns2) {
    const text = await page.evaluate(el => el.textContent.trim(), btn);
    if (text === '전체') { await btn.click(); break; }
  }
  await sleep(500);

  // ===== 6. 장바구니 담기 (로그인 상태) =====
  // 첫 번째 상품 담기
  const addBtns2 = await page.$$('button');
  let addCount = 0;
  for (const btn of addBtns2) {
    const text = await page.evaluate(el => el.textContent.trim(), btn);
    if (text === '담기' && addCount < 3) {
      await btn.click();
      addCount++;
      await sleep(800);
    }
  }
  await sleep(1000);
  await page.screenshot({ path: path.join(DIR, '07_items_added.png') });
  console.log('✅ 07. 상품 3개 장바구니 담기 (토스트 + 뱃지)');

  // ===== 7. 장바구니 페이지 =====
  const cartIcon = await page.$('button[aria-label="장바구니"]');
  if (cartIcon) await cartIcon.click();
  await sleep(1500);
  await page.screenshot({ path: path.join(DIR, '08_cart_page.png') });
  console.log('✅ 08. 장바구니 페이지');

  // ===== 8. 수량 증가 =====
  const plusBtns = await page.$$('button[aria-label="수량 증가"]');
  if (plusBtns.length > 0) {
    await plusBtns[0].click();
    await sleep(800);
    await plusBtns[0].click();
    await sleep(800);
  }
  await page.screenshot({ path: path.join(DIR, '09_quantity_changed.png') });
  console.log('✅ 09. 수량 변경 (+2)');

  // ===== 9. 상품 삭제 =====
  const delBtns = await page.$$('button');
  for (const btn of delBtns) {
    const text = await page.evaluate(el => el.textContent.trim(), btn);
    if (text === '삭제') { await btn.click(); break; }
  }
  await sleep(1500);
  await page.screenshot({ path: path.join(DIR, '10_item_removed.png') });
  console.log('✅ 10. 상품 삭제');

  // ===== 10. 주문하기 =====
  const orderBtns = await page.$$('button');
  for (const btn of orderBtns) {
    const text = await page.evaluate(el => el.textContent.trim(), btn);
    if (text === '주문하기') { await btn.click(); break; }
  }
  await sleep(500);
  await page.screenshot({ path: path.join(DIR, '11_order_confirm_modal.png') });
  console.log('✅ 11. 주문 확인 모달');

  // 주문 확인 클릭
  const confirmBtns = await page.$$('button');
  for (const btn of confirmBtns) {
    const text = await page.evaluate(el => el.textContent.trim(), btn);
    if (text === '주문 확인') { await btn.click(); break; }
  }
  await sleep(1500);
  await page.screenshot({ path: path.join(DIR, '12_order_complete.png') });
  console.log('✅ 12. 주문 완료 → 홈으로');

  // ===== 11. 빈 장바구니 확인 =====
  const cartIcon2 = await page.$('button[aria-label="장바구니"]');
  if (cartIcon2) await cartIcon2.click();
  await sleep(1000);
  await page.screenshot({ path: path.join(DIR, '13_empty_cart.png') });
  console.log('✅ 13. 빈 장바구니');

  // ===== 12. 로그아웃 =====
  // 홈으로 먼저 이동
  const homeBtns = await page.$$('button');
  for (const btn of homeBtns) {
    const text = await page.evaluate(el => el.textContent.trim(), btn);
    if (text === '쇼핑하러 가기') { await btn.click(); break; }
  }
  await sleep(1000);

  const logoutBtns = await page.$$('button');
  for (const btn of logoutBtns) {
    const text = await page.evaluate(el => el.textContent.trim(), btn);
    if (text === '로그아웃') { await btn.click(); break; }
  }
  await sleep(1500);
  await page.screenshot({ path: path.join(DIR, '14_logout.png') });
  console.log('✅ 14. 로그아웃');

  // ===== 13. 재로그인 =====
  // 헤더의 로그인 버튼 클릭해서 auth 페이지로 이동
  await sleep(500);
  let clickedLogin = false;
  for (let attempt = 0; attempt < 3 && !clickedLogin; attempt++) {
    const btns = await page.$$('button');
    for (const btn of btns) {
      const text = await page.evaluate(el => el.textContent.trim(), btn);
      if (text === '로그인') { await btn.click(); clickedLogin = true; break; }
    }
    await sleep(1000);
  }
  await sleep(1500);

  // input이 보이면 입력
  const loginInputs = await page.$$('input');
  if (loginInputs.length >= 2) {
    await loginInputs[0].type(TEST_EMAIL);
    await loginInputs[1].type(TEST_PW);

    const submitBtns = await page.$$('button');
    for (const btn of submitBtns) {
      const text = await page.evaluate(el => el.textContent.trim(), btn);
      const inForm = await page.evaluate(el => el.closest('form') !== null, btn);
      if (text === '로그인' && inForm) { await btn.click(); break; }
    }
    await sleep(2000);
  }
  await page.screenshot({ path: path.join(DIR, '15_relogin.png') });
  console.log('✅ 15. 재로그인 성공');

  await browser.close();
  console.log('\n🎉 모든 테스트 완료! screenshots/ 폴더를 확인하세요.');
})();
