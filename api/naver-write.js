// /api/naver-write.js
module.exports = async (req, res) => { ... }
  try {
    if (req.method !== "POST")
      return res.status(405).send("POST만 지원합니다.");

    const { title = "테스트 제목", contents = "테스트 본문" } =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});

    const write = async (token) => {
      const form = new URLSearchParams();
      form.append("title", title);
      form.append("contents", contents);
      return fetch("https://openapi.naver.com/blog/writePost.json", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
        },
        body: form
      });
    };

    // 1) 기존 Access Token으로 시도
    let resp = await write(process.env.NAVER_ACCESS_TOKEN);

    // 2) 만료(401)이면 Refresh로 새 토큰 받고 재시도
    if (resp.status === 401) {
      const r = await fetch("https://nid.naver.com/oauth2.0/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: process.env.NAVER_CLIENT_ID,
          client_secret: process.env.NAVER_CLIENT_SECRET,
          refresh_token: process.env.NAVER_REFRESH_TOKEN
        })
      });
      const j = await r.json();
      if (!j.access_token) return res.status(401).send(`<pre>${JSON.stringify(j, null, 2)}</pre>`);
      resp = await write(j.access_token);
    }

    const data = await resp.json();
    if (data.message === "success") {
      return res.status(200).send(`
        <h2>✅ 블로그 글 발행 성공!</h2>
        <a href="${data.result.postUrl}" target="_blank">${data.result.postUrl}</a>
      `);
    }
    return res.status(resp.status).send(`<pre>${JSON.stringify(data, null, 2)}</pre>`);
  } catch (e) {
    return res.status(500).send(`서버 오류: ${e?.message ?? e}`);
  }
}
