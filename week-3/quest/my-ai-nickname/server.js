const http = require("http");
const fs = require("fs");
const path = require("path");
const https = require("https");

const PORT = 3003;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "여기에-API-키를-입력하세요";

const STYLE_PROMPTS = {
  hollywood: `할리우드/서양 스타일로 별명을 만들어주세요. 영어 이름, 영화 캐릭터 느낌, 서양식 닉네임 등을 활용하세요.`,
  kdrama: `K-Drama 스타일로 별명을 만들어주세요. 한국 드라마 캐릭터 느낌, 로맨틱하거나 카리스마 있는 한국식 별명을 만들어주세요.`,
  animal: `귀여운 동물 스타일로 별명을 만들어주세요. 동물 이름이나 동물 특성을 활용한 귀여운 별명을 만들어주세요.`,
  game: `게임/판타지 스타일로 별명을 만들어주세요. RPG 캐릭터, 게이머 태그, 판타지 세계관 느낌의 별명을 만들어주세요.`,
  food: `음식 스타일로 별명을 만들어주세요. 맛있는 음식, 디저트, 요리 재료 등을 활용한 유쾌한 별명을 만들어주세요.`,
  random: `어떤 스타일이든 상관없이 자유롭게 재미있는 별명을 만들어주세요.`,
};

const SYSTEM_PROMPT = `당신은 재미있고 창의적인 별명 생성 전문가입니다.

규칙:
- 사용자가 제공한 이름, 성격, 취미 정보를 바탕으로 재미있고 독창적인 별명을 5개 생성하세요
- 각 별명에는 왜 그 별명이 어울리는지 짧은 이유(1문장)를 함께 제공하세요
- 사용자가 요청한 스타일에 맞춰 별명을 만들어주세요
- 반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요:

[
  { "nickname": "별명1", "reason": "이유1" },
  { "nickname": "별명2", "reason": "이유2" },
  { "nickname": "별명3", "reason": "이유3" },
  { "nickname": "별명4", "reason": "이유4" },
  { "nickname": "별명5", "reason": "이유5" }
]`;

// ========================================
// OpenAI API 호출
// ========================================
function callOpenAI(userMessage) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      max_tokens: 600,
      temperature: 1.0,
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

  // POST /api/nickname — AI 별명 생성
  if (url.pathname === "/api/nickname" && req.method === "POST") {
    try {
      const { name, personality, hobby, style } = await parseBody(req);

      if (!name) {
        res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ error: "이름은 필수입니다." }));
        return;
      }

      const styleGuide = STYLE_PROMPTS[style] || STYLE_PROMPTS.random;
      const userMessage = `이름: ${name}\n성격: ${personality || "정보 없음"}\n취미: ${hobby || "정보 없음"}\n\n스타일 지시: ${styleGuide}`;
      const reply = await callOpenAI(userMessage);

      // JSON 파싱 시도
      let nicknames;
      try {
        nicknames = JSON.parse(reply);
      } catch {
        // JSON 블록 추출 시도
        const match = reply.match(/\[[\s\S]*\]/);
        if (match) {
          nicknames = JSON.parse(match[0]);
        } else {
          throw new Error("AI 응답을 파싱할 수 없습니다.");
        }
      }

      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ nicknames }));
    } catch (err) {
      console.error("API 오류:", err.message);
      res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: "별명 생성에 실패했습니다." }));
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
  console.log(`🏷️  AI 별명 생성기 서버 실행 중: http://localhost:${PORT}`);
  console.log(`📡 API: POST /api/nickname`);
});
