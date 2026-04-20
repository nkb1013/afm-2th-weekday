const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const BASE = 'http://localhost:3001';
const DIR = path.join(__dirname, 'screenshots');

async function main() {
  fs.mkdirSync(DIR, { recursive: true });

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 480, height: 800, deviceScaleFactor: 2 });

  // ── 1. 로그인 화면 ──
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  // 토큰 클리어
  await page.evaluate(() => localStorage.removeItem('todo_token'));
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForSelector('input[type="email"]');
  await page.screenshot({ path: path.join(DIR, '01_login_page.png') });
  console.log('1. 로그인 화면 캡처 완료');

  // ── 2. 회원가입 화면 ──
  await page.click('button.text-gray-600');
  await page.waitForSelector('input[placeholder="닉네임"]');
  await page.screenshot({ path: path.join(DIR, '02_signup_page.png') });
  console.log('2. 회원가입 화면 캡처 완료');

  // ── 3. 로그인 실패 ──
  // 다시 로그인 모드로
  const loginBtn = await page.$('button.text-gray-600');
  if (loginBtn) await loginBtn.click();
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', 'alice@test.com');
  await page.type('input[type="password"]', 'wrongpassword');
  await page.click('button[type="submit"]');
  await page.waitForSelector('.text-red-500', { timeout: 5000 });
  await page.screenshot({ path: path.join(DIR, '03_login_fail.png') });
  console.log('3. 로그인 실패 캡처 완료');

  // ── 4. 로그인 성공 → 할일 목록 ──
  // 필드 클리어 후 재입력
  await page.evaluate(() => {
    document.querySelectorAll('input').forEach(i => i.value = '');
  });
  const emailInput = await page.$('input[type="email"]');
  await emailInput.click({ clickCount: 3 });
  await emailInput.type('alice@test.com');
  const pwInput = await page.$('input[type="password"]');
  await pwInput.click({ clickCount: 3 });
  await pwInput.type('1234');
  await page.click('button[type="submit"]');
  await page.waitForSelector('ul', { timeout: 5000 });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(DIR, '04_todo_list.png') });
  console.log('4. 할일 목록 (alice) 캡처 완료');

  // ── 5. 할일 추가 ──
  await page.type('input[placeholder="할 일을 입력하세요"]', '스크린샷 테스트 할일');
  await page.screenshot({ path: path.join(DIR, '05_todo_input.png') });
  console.log('5. 할일 입력 캡처 완료');

  await page.click('button.bg-gray-800:not([type="submit"])');
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(DIR, '06_todo_added.png') });
  console.log('6. 할일 추가 후 캡처 완료');

  // ── 6. 할일 완료 토글 ──
  const checkBtn = await page.$('ul li:first-child button.rounded-full');
  if (checkBtn) {
    await checkBtn.click();
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(DIR, '07_todo_toggled.png') });
    console.log('7. 할일 완료 토글 캡처 완료');
  }

  // ── 7. 관리자 로그인 ──
  // 로그아웃
  const logoutBtn = await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')];
    const b = btns.find(b => b.textContent.includes('로그아웃'));
    if (b) { b.click(); return true; }
    return false;
  });
  await new Promise(r => setTimeout(r, 500));

  // 관리자 로그인
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', 'keumbi.noh@gmail.com');
  await page.type('input[type="password"]', '12345678');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(DIR, '08_admin_todo_page.png') });
  console.log('8. 관리자 Todo 화면 (관리자 버튼 포함) 캡처 완료');

  // ── 8. 관리자 페이지 ──
  try {
    await page.goto(BASE + '/admin.html', { waitUntil: 'networkidle0', timeout: 5000 });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(DIR, '09_admin_page.png') });
    console.log('9. 관리자 페이지 캡처 완료');
  } catch (e) {
    console.log('9. 관리자 페이지 없거나 로드 실패:', e.message);
  }

  // ── Cleanup: 테스트 할일 삭제, 테스트 유저 삭제 ──
  // (API로 정리)
  const token = await page.evaluate(() => localStorage.getItem('todo_token'));

  await browser.close();
  console.log('\n모든 스크린샷이 screenshots/ 폴더에 저장되었습니다.');
}

main().catch(err => { console.error(err); process.exit(1); });
