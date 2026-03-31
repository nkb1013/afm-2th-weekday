const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;

// ========================================
// 포켓몬 데이터
// ========================================
const POKEMON_DATA = [
  {
    id: 1,
    nameKo: "이상해씨",
    nameEn: "Bulbasaur",
    types: ["풀", "독"],
    image:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png",
    stats: { hp: 45, attack: 49, defense: 49, speed: 45 },
    description:
      "태어났을 때부터 등에 이상한 씨앗이 심어져 있으며, 몸과 함께 자란다.",
  },
  {
    id: 4,
    nameKo: "파이리",
    nameEn: "Charmander",
    types: ["불꽃"],
    image:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png",
    stats: { hp: 39, attack: 52, defense: 43, speed: 65 },
    description:
      "꼬리에 태어났을 때부터 불꽃이 타오르고 있다. 불꽃이 꺼지면 생명도 다한다.",
  },
  {
    id: 7,
    nameKo: "꼬부기",
    nameEn: "Squirtle",
    types: ["물"],
    image:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/7.png",
    stats: { hp: 44, attack: 48, defense: 65, speed: 43 },
    description:
      "긴 목을 등껍질 안으로 집어넣고 입에서 물을 내뿜어 공격한다.",
  },
  {
    id: 25,
    nameKo: "피카츄",
    nameEn: "Pikachu",
    types: ["전기"],
    image:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png",
    stats: { hp: 35, attack: 55, defense: 40, speed: 90 },
    description:
      "양 볼에 작은 전기 주머니가 있다. 위험해지면 전기를 방출한다.",
  },
  {
    id: 133,
    nameKo: "이브이",
    nameEn: "Eevee",
    types: ["노말"],
    image:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png",
    stats: { hp: 55, attack: 55, defense: 50, speed: 55 },
    description:
      "불안정한 유전자를 지녀 다양한 환경에 적응하여 여러 모습으로 진화한다.",
  },
];

// ========================================
// API 라우팅
// ========================================
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // CORS 헤더
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  // GET /api/pokemon — 전체 목록
  if (url.pathname === "/api/pokemon" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(POKEMON_DATA));
    return;
  }

  // GET /api/pokemon/search?q=검색어 — 검색
  if (url.pathname === "/api/pokemon/search" && req.method === "GET") {
    const q = (url.searchParams.get("q") || "").trim();

    if (!q) {
      res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: "검색어를 입력해주세요." }));
      return;
    }

    const found = POKEMON_DATA.find(
      (p) =>
        p.nameKo === q ||
        p.nameEn.toLowerCase() === q.toLowerCase() ||
        String(p.id) === q ||
        `#${p.id}` === q
    );

    if (found) {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(found));
    } else {
      res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: `"${q}"에 해당하는 포켓몬이 없습니다.` }));
    }
    return;
  }

  // 정적 파일 서빙 (index.html)
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
  console.log(`🚀 포켓몬 도감 서버 실행 중: http://localhost:${PORT}`);
  console.log(`📡 API 엔드포인트:`);
  console.log(`   GET /api/pokemon         — 전체 포켓몬 목록`);
  console.log(`   GET /api/pokemon/search?q=피카츄 — 포켓몬 검색`);
});
