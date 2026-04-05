const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.static("."));

app.get("/api/hello", (req, res) => {
  res.json({ message: "안녕하세요" });
});

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
