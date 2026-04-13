const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = __dirname;

// ------------------------------------
// Middleware
// ------------------------------------
app.use(express.json());
app.use(express.static(DATA_DIR));

// ------------------------------------
// Helper: todo 파일명 패턴 매칭
// ------------------------------------
function isTodoFile(filename) {
  return /^todo\d+$/.test(filename);
}

function getTodoNumber(filename) {
  return parseInt(filename.replace('todo', ''), 10);
}

// ------------------------------------
// Helper: 파일에서 todo 객체 읽기
// ------------------------------------
function readTodoFile(filename) {
  const filePath = path.join(DATA_DIR, filename);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const text = (lines[0] || '').trim();
  const doneRaw = (lines[1] || '').trim();
  const done = doneRaw === 'true';
  return { id: filename, text, done };
}

// ------------------------------------
// Helper: todo 객체를 파일에 쓰기
// ------------------------------------
function writeTodoFile(filename, text, done) {
  const filePath = path.join(DATA_DIR, filename);
  const content = `${text}\n${done ? 'true' : 'false'}`;
  fs.writeFileSync(filePath, content, 'utf-8');
}

// ------------------------------------
// Helper: 다음 todo 번호 계산
// ------------------------------------
function getNextTodoNumber() {
  const files = fs.readdirSync(DATA_DIR).filter(isTodoFile);
  if (files.length === 0) return 1;
  const maxNum = Math.max(...files.map(getTodoNumber));
  return maxNum + 1;
}

// ------------------------------------
// GET /api/todos - 전체 할일 목록 조회
// ------------------------------------
app.get('/api/todos', (_req, res) => {
  try {
    const files = fs.readdirSync(DATA_DIR).filter(isTodoFile);
    files.sort((a, b) => getTodoNumber(a) - getTodoNumber(b));
    const todos = files.map(readTodoFile);
    res.json({ success: true, data: todos });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to read todos' });
  }
});

// ------------------------------------
// POST /api/todos - 새 할일 생성
// ------------------------------------
app.post('/api/todos', (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Text is required' });
    }

    const nextNum = getNextTodoNumber();
    const filename = `todo${nextNum}`;
    writeTodoFile(filename, text.trim(), false);

    const todo = { id: filename, text: text.trim(), done: false };
    res.status(201).json({ success: true, data: todo });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create todo' });
  }
});

// ------------------------------------
// PUT /api/todos/:id - 할일 수정
// ------------------------------------
app.put('/api/todos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const filePath = path.join(DATA_DIR, id);

    if (!isTodoFile(id) || !fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }

    const existing = readTodoFile(id);
    const text = req.body.text !== undefined ? req.body.text.trim() : existing.text;
    const done = req.body.done !== undefined ? req.body.done : existing.done;

    writeTodoFile(id, text, done);

    res.json({ success: true, data: { id, text, done } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update todo' });
  }
});

// ------------------------------------
// DELETE /api/todos/:id - 할일 삭제
// ------------------------------------
app.delete('/api/todos/:id', (req, res) => {
  try {
    const { id } = req.params;
    const filePath = path.join(DATA_DIR, id);

    if (!isTodoFile(id) || !fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }

    fs.unlinkSync(filePath);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete todo' });
  }
});

// ------------------------------------
// SPA fallback (Express 5 문법)
// ------------------------------------
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(DATA_DIR, 'index.html'));
});

// ------------------------------------
// Local / Vercel dual-mode
// ------------------------------------
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}
module.exports = app;
