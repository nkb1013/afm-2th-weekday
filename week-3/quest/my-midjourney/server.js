const http = require("http");
const fs = require("fs");
const path = require("path");
const https = require("https");

const PORT = 3002;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "여기에-API-키를-입력하세요";

// ========================================
// 이미지 스타일 프리셋
// ========================================
const STYLE_PRESETS = {
  "studio-ghibli": {
    name: "스튜디오 지브리",
    emoji: "🏯",
    prompt:
      "in the style of Studio Ghibli anime, soft watercolor textures, whimsical and dreamlike atmosphere, lush nature details, warm color palette, hand-drawn aesthetic",
  },
  "cyberpunk": {
    name: "사이버펑크",
    emoji: "🌆",
    prompt:
      "cyberpunk style, neon lights, futuristic cityscape, dark atmosphere with vibrant neon colors, rain-soaked streets, holographic displays, high-tech low-life aesthetic",
  },
  "watercolor": {
    name: "수채화",
    emoji: "🎨",
    prompt:
      "beautiful watercolor painting, soft blending, wet-on-wet technique, delicate brush strokes, pastel tones, artistic and dreamy, traditional watercolor on textured paper",
  },
  "pixel-art": {
    name: "픽셀 아트",
    emoji: "👾",
    prompt:
      "pixel art style, 16-bit retro game aesthetic, limited color palette, crisp pixels, nostalgic gaming vibe, detailed pixel work",
  },
  "oil-painting": {
    name: "유화",
    emoji: "🖼️",
    prompt:
      "classical oil painting style, rich impasto texture, dramatic lighting, Renaissance-inspired composition, visible brush strokes, museum-quality fine art",
  },
  "3d-render": {
    name: "3D 렌더링",
    emoji: "💎",
    prompt:
      "high-quality 3D render, octane render, realistic lighting, glossy materials, soft shadows, studio lighting setup, ultra-detailed, photorealistic 3D",
  },
  "comic-book": {
    name: "만화",
    emoji: "💥",
    prompt:
      "comic book art style, bold outlines, halftone dots, dynamic composition, vibrant flat colors, action-packed, Marvel/DC comic aesthetic",
  },
  "minimalist": {
    name: "미니멀리스트",
    emoji: "⬜",
    prompt:
      "minimalist design, clean lines, simple geometric shapes, limited color palette, lots of white space, modern and elegant, flat design aesthetic",
  },
  "fantasy": {
    name: "판타지",
    emoji: "🐉",
    prompt:
      "epic fantasy art, magical atmosphere, ethereal lighting, detailed fantasy world, enchanted scenery, mystical creatures, concept art quality, dramatic sky",
  },
  "photo-realistic": {
    name: "포토리얼리스틱",
    emoji: "📷",
    prompt:
      "photorealistic, ultra high resolution, shot on Canon EOS R5, natural lighting, shallow depth of field, 8k, hyper-detailed, professional photography",
  },
};

// ========================================
// OpenAI DALL-E 3 API 호출
// ========================================
const SIZE_MAP = {
  square_hd: "1024x1024",
  landscape_16_9: "1792x1024",
  portrait_16_9: "1024x1792",
};

function generateImage(prompt, size = "square_hd") {
  return new Promise((resolve, reject) => {
    const dalleSize = SIZE_MAP[size] || "1024x1024";
    const body = JSON.stringify({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: dalleSize,
      quality: "standard",
    });

    const options = {
      hostname: "api.openai.com",
      path: "/v1/images/generations",
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
            reject(new Error(json.error.message || JSON.stringify(json.error)));
          } else {
            resolve({
              url: json.data[0].url,
              revised_prompt: json.data[0].revised_prompt || prompt,
            });
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

  // GET /api/styles — 스타일 목록 조회
  if (url.pathname === "/api/styles" && req.method === "GET") {
    const styles = Object.entries(STYLE_PRESETS).map(([id, style]) => ({
      id,
      name: style.name,
      emoji: style.emoji,
    }));
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ styles }));
    return;
  }

  // POST /api/generate — 이미지 생성
  if (url.pathname === "/api/generate" && req.method === "POST") {
    try {
      const { prompt, styleId, size } = await parseBody(req);

      if (!prompt) {
        res.writeHead(400, {
          "Content-Type": "application/json; charset=utf-8",
        });
        res.end(JSON.stringify({ error: "프롬프트를 입력해주세요." }));
        return;
      }

      const style = STYLE_PRESETS[styleId];
      if (!style) {
        res.writeHead(400, {
          "Content-Type": "application/json; charset=utf-8",
        });
        res.end(JSON.stringify({ error: "유효하지 않은 스타일입니다." }));
        return;
      }

      // 사용자 프롬프트 + 스타일 프롬프트 결합
      const fullPrompt = `${prompt}, ${style.prompt}`;
      console.log(`🎨 이미지 생성 요청: [${style.name}] ${prompt}`);

      const result = await generateImage(fullPrompt, size || "square_hd");

      console.log(`✅ 이미지 생성 완료!`);

      res.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
      });
      res.end(
        JSON.stringify({
          imageUrl: result.url,
          revisedPrompt: result.revised_prompt,
          style: style.name,
          originalPrompt: prompt,
        })
      );
    } catch (err) {
      console.error("이미지 생성 오류:", err.message);
      res.writeHead(500, {
        "Content-Type": "application/json; charset=utf-8",
      });
      res.end(JSON.stringify({ error: "이미지 생성에 실패했습니다: " + err.message }));
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
  console.log(`🎨 My Midjourney 서버 실행 중: http://localhost:${PORT}`);
  console.log(`📡 API 엔드포인트:`);
  console.log(`   GET  /api/styles   — 스타일 목록`);
  console.log(`   POST /api/generate — 이미지 생성`);
});
