const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DIR = __dirname;

// --- Middleware ---
app.use(express.json());
app.use(express.static(DIR));

// --- Helpers ---

/**
 * Read all todo*.json files from the directory and return sorted by id.
 */
function readAllTodos() {
  const files = fs.readdirSync(DIR).filter(f => /^todo\d+\.json$/.test(f));
  const todos = files.map(f => {
    const content = fs.readFileSync(path.join(DIR, f), 'utf-8');
    return JSON.parse(content);
  });
  todos.sort((a, b) => a.id - b.id);
  return todos;
}

/**
 * Find the file path for a given todo id.
 * Returns null if no matching file exists.
 */
function findTodoFile(id) {
  const filename = `todo${id}.json`;
  const filepath = path.join(DIR, filename);
  return fs.existsSync(filepath) ? filepath : null;
}

// --- API Routes ---

// GET /api/todos - list all todos
app.get('/api/todos', (_req, res) => {
  try {
    const todos = readAllTodos();
    res.json({ success: true, data: todos });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to read todos' });
  }
});

// POST /api/todos - create a new todo
app.post('/api/todos', (req, res) => {
  try {
    const { todo } = req.body;
    if (!todo || typeof todo !== 'string' || !todo.trim()) {
      return res.status(400).json({ success: false, message: 'todo field is required' });
    }

    const existing = readAllTodos();
    const nextId = existing.length > 0 ? Math.max(...existing.map(t => t.id)) + 1 : 1;

    const newTodo = { id: nextId, todo: todo.trim(), done: false };
    const filepath = path.join(DIR, `todo${nextId}.json`);
    fs.writeFileSync(filepath, JSON.stringify(newTodo, null, 4), 'utf-8');

    res.status(201).json({ success: true, data: newTodo });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create todo' });
  }
});

// PUT /api/todos/:id - update a todo
app.put('/api/todos/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }

    const filepath = findTodoFile(id);
    if (!filepath) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }

    const current = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

    // Update only the fields provided in the request body
    if (req.body.todo !== undefined) {
      current.todo = req.body.todo;
    }
    if (req.body.done !== undefined) {
      current.done = req.body.done;
    }

    fs.writeFileSync(filepath, JSON.stringify(current, null, 4), 'utf-8');

    res.json({ success: true, data: current });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update todo' });
  }
});

// DELETE /api/todos/:id - delete a todo
app.delete('/api/todos/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }

    const filepath = findTodoFile(id);
    if (!filepath) {
      return res.status(404).json({ success: false, message: 'Todo not found' });
    }

    fs.unlinkSync(filepath);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete todo' });
  }
});

// --- SPA Fallback ---
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(DIR, 'index.html'));
});

// --- Start / Export ---
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}
module.exports = app;
