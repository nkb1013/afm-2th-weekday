const http = require("http");
const fs = require("fs");
const path = require("path");
const https = require("https");

const PORT = 3001;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "여기에-API-키를-입력하세요";

const SYSTEM_PROMPT = `당신은 심리 상담사 "노팅"입니다.

[성격]
- 차분하고 깊이 있는 통찰을 제공한다
- 판단하지 않고, 내담자가 스스로 관찰하게 돕는다

[말투]
- 부드럽고 짧은 문장을 사용한다
- 질문을 던지는 방식으로 대화를 이끈다
- 한국어로 대화한다

[전문분야]
- 자기인식, 감정 탐색, 명상

[규칙]
- 절대 해결책을 강요하지 않는다
- 항상 "알아차림"으로 유도한다
- 내담자가 자신의 감정을 직접 느끼고 인식하도록 돕는다
- 위기 상황(자해, 자살 등)이 감지되면 전문 상담 기관(정신건강위기상담전화 1577-0199)을 안내한다

[대화 예시]
Q: 너무 불안해요
A: 그 불안, 지금 어디에서 가장 크게 느껴지나요?

Q: 요즘 아무것도 하기 싫어요
A: 하기 싫다는 마음, 언제부터 느끼셨나요? 잠시 그 감정 곁에 머물러볼까요?`;

// ========================================
// OpenAI API 호출
// ========================================
function callOpenAI(messages) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 500,
      temperature: 0.8,
    });

    const options = {
      hostname: "api.openai.com",
      path: "/v1/chat/completions",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            reject(new Error(json.error.message));
          } else {
            resolve(json.choices[0].message.content);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// ========================================
// 요청 본문 파싱
// ========================================
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(e);
      }
    });
  });
}

// ========================================
// HTTP 서버
// ========================================
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // POST /api/chat — AI 상담 응답
  if (url.pathname === "/api/chat" && req.method === "POST") {
    try {
      const { messages } = await parseBody(req);

      if (!messages || !Array.isArray(messages)) {
        res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ error: "messages 배열이 필요합니다." }));
        return;
      }

      const reply = await callOpenAI(messages);

      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ reply }));
    } catch (err) {
      console.error("OpenAI API 오류:", err.message);
      res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: "AI 응답을 가져오지 못했습니다." }));
    }
    return;
  }

  // 정적 파일 서빙
  if (url.pathname === "/" || url.pathname === "/index.html") {
    const filePath = path.join(__dirname, "index.html");
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end("서버 오류");
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(data);
    });
    return;
  }

  // 404
  res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify({ error: "Not Found" }));
});

server.listen(PORT, () => {
  console.log(`🧠 심리 상담 챗봇 서버 실행 중: http://localhost:${PORT}`);
  console.log(`📡 API: POST /api/chat`);
});
