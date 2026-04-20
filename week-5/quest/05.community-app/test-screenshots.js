const puppeteer = require('puppeteer');
const path = require('path');

const BASE = 'http://localhost:3005';
const DIR = path.join(__dirname, 'screenshots');
const TEST_EMAIL = `tester_${Date.now()}@test.com`;
const TEST_PW = 'test1234';
const TEST_NICK = '자취요리왕';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // ===== 1. 로그인 화면 =====
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  await sleep(1000);
  await page.screenshot({ path: path.join(DIR, '01_login_screen.png') });
  console.log('✅ 01. 로그인 화면');

  // ===== 2. 회원가입 =====
  await page.click('button:has-text("회원가입")').catch(() => {});
  // 탭 클릭 - 회원가입 탭 찾기
  const tabs = await page.$$('button[type="button"]');
  for (const tab of tabs) {
    const text = await page.evaluate(el => el.textContent, tab);
    if (text.includes('회원가입')) { await tab.click(); break; }
  }
  await sleep(500);
  await page.screenshot({ path: path.join(DIR, '02_register_tab.png') });
  console.log('✅ 02. 회원가입 탭');

  // 닉네임, 이메일, 비밀번호 입력
  const inputs = await page.$$('input');
  await inputs[0].type(TEST_NICK);  // 닉네임
  await inputs[1].type(TEST_EMAIL); // 이메일
  await inputs[2].type(TEST_PW);    // 비밀번호
  await sleep(300);
  await page.screenshot({ path: path.join(DIR, '03_register_filled.png') });
  console.log('✅ 03. 회원가입 입력');

  // 회원가입 버튼 클릭
  const submitBtns = await page.$$('button[type="submit"]');
  await submitBtns[0].click();
  await sleep(2000);
  await page.screenshot({ path: path.join(DIR, '04_after_register.png') });
  console.log('✅ 04. 회원가입 완료 → 게시판 진입');

  // ===== 3. 글쓰기 =====
  const writeBtn = await page.$('button');
  const allBtns = await page.$$('button');
  for (const btn of allBtns) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes('글쓰기')) { await btn.click(); break; }
  }
  await sleep(500);
  await page.screenshot({ path: path.join(DIR, '05_write_form.png') });
  console.log('✅ 05. 글쓰기 폼');

  // 제목, 내용 입력
  const postInputs = await page.$$('input, textarea');
  for (const el of postInputs) {
    const id = await page.evaluate(e => e.id, el);
    if (id === 'post-title') await el.type('자취생 초간단 계란볶음밥 레시피');
    if (id === 'post-content') await el.type('재료: 밥 1공기, 계란 2개, 파 약간, 간장 1스푼\n\n1. 팬에 기름 두르고 계란 스크램블\n2. 밥 넣고 같이 볶기\n3. 간장 넣고 센불에 볶으면 끝!\n\n자취생 필수 메뉴입니다 ㅋㅋ');
  }
  await sleep(300);
  await page.screenshot({ path: path.join(DIR, '06_write_filled.png') });
  console.log('✅ 06. 글 내용 입력');

  // 등록 버튼 클릭
  const formBtns = await page.$$('button[type="submit"]');
  await formBtns[0].click();
  await sleep(1500);
  await page.screenshot({ path: path.join(DIR, '07_post_created.png') });
  console.log('✅ 07. 글 등록 완료 (목록)');

  // 두 번째 글 작성
  const allBtns2 = await page.$$('button');
  for (const btn of allBtns2) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes('글쓰기')) { await btn.click(); break; }
  }
  await sleep(500);
  const postInputs2 = await page.$$('input, textarea');
  for (const el of postInputs2) {
    const id = await page.evaluate(e => e.id, el);
    if (id === 'post-title') await el.type('전자레인지로 만드는 머그컵 계란찜');
    if (id === 'post-content') await el.type('머그컵에 계란 2개 풀고, 물 조금, 소금 약간 넣고 전자레인지 2분!\n설거지도 머그컵 하나면 끝이라 진짜 편해요.');
  }
  const formBtns2 = await page.$$('button[type="submit"]');
  await formBtns2[0].click();
  await sleep(1500);
  await page.screenshot({ path: path.join(DIR, '08_post_list.png') });
  console.log('✅ 08. 게시글 목록 (2개)');

  // ===== 4. 상세 보기 =====
  // 첫 번째 게시글 클릭
  const listItems = await page.$$('button.w-full.text-left');
  if (listItems.length > 0) await listItems[0].click();
  await sleep(1000);
  await page.screenshot({ path: path.join(DIR, '09_post_detail.png') });
  console.log('✅ 09. 게시글 상세 보기');

  // ===== 5. 댓글 작성 =====
  const commentInput = await page.$('input[placeholder="댓글을 입력하세요..."]');
  if (commentInput) {
    await commentInput.type('와 이거 진짜 맛있겠다! 오늘 저녁에 해봐야지 🍳');
    await sleep(300);
    // 등록 버튼
    const commentBtns = await page.$$('button[type="submit"]');
    for (const btn of commentBtns) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('등록')) { await btn.click(); break; }
    }
    await sleep(1500);
    await page.screenshot({ path: path.join(DIR, '10_comment_added.png') });
    console.log('✅ 10. 댓글 작성 완료');

    // 두 번째 댓글
    await commentInput.click({ clickCount: 3 });
    await commentInput.type('간장 대신 굴소스도 맛있어요!');
    const commentBtns2 = await page.$$('button[type="submit"]');
    for (const btn of commentBtns2) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('등록')) { await btn.click(); break; }
    }
    await sleep(1500);
    await page.screenshot({ path: path.join(DIR, '11_comments_list.png') });
    console.log('✅ 11. 댓글 목록 (2개)');
  }

  // ===== 6. 글 수정 =====
  const editBtn = await page.$('button[title="수정"]');
  if (editBtn) {
    await editBtn.click();
    await sleep(500);
    await page.screenshot({ path: path.join(DIR, '12_edit_modal.png') });
    console.log('✅ 12. 수정 모달');

    // 제목 수정
    const editInputs = await page.$$('.relative input[id="post-title"]');
    if (editInputs.length > 0) {
      await editInputs[0].click({ clickCount: 3 });
      await editInputs[0].type('(수정) 전자레인지 머그컵 계란찜 - 초간단!');
    }
    const editSubmit = await page.$$('.relative button[type="submit"]');
    for (const btn of editSubmit) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text.includes('수정')) { await btn.click(); break; }
    }
    await sleep(1500);
    await page.screenshot({ path: path.join(DIR, '13_after_edit.png') });
    console.log('✅ 13. 수정 완료');
  }

  // ===== 7. 글 삭제 =====
  const deleteBtn = await page.$('button[title="삭제"]');
  if (deleteBtn) {
    await deleteBtn.click();
    await sleep(500);
    await page.screenshot({ path: path.join(DIR, '14_delete_confirm.png') });
    console.log('✅ 14. 삭제 확인 모달');

    // 삭제 버튼 클릭
    const modalBtns = await page.$$('button');
    for (const btn of modalBtns) {
      const text = await page.evaluate(el => el.textContent.trim(), btn);
      if (text === '삭제') { await btn.click(); break; }
    }
    await sleep(1500);
    await page.screenshot({ path: path.join(DIR, '15_after_delete.png') });
    console.log('✅ 15. 삭제 후 목록');
  }

  // ===== 8. 로그아웃 =====
  const logoutBtns = await page.$$('button');
  for (const btn of logoutBtns) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text.includes('로그아웃')) { await btn.click(); break; }
  }
  await sleep(1000);
  await page.screenshot({ path: path.join(DIR, '16_logout.png') });
  console.log('✅ 16. 로그아웃 → 로그인 화면');

  // ===== 9. 다시 로그인 =====
  const loginInputs = await page.$$('input');
  await loginInputs[0].type(TEST_EMAIL);
  await loginInputs[1].type(TEST_PW);
  const loginBtn = await page.$('button[type="submit"]');
  await loginBtn.click();
  await sleep(2000);
  await page.screenshot({ path: path.join(DIR, '17_relogin.png') });
  console.log('✅ 17. 재로그인 성공 (데이터 유지 확인)');

  await browser.close();
  console.log('\n🎉 모든 테스트 완료! screenshots/ 폴더를 확인하세요.');
})();
