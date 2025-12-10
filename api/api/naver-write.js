// /api/naver-write.js
export default async function handler(req, res) {
  try {
    if ((req.method || "POST") !== "POST") 
      return res.status(405).send("POST만 지원합니다.");

    const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const { title = "API 테스트 글", contents = "네이버 API 자동발행 테스트입니다.<br>이 문장은 본문입니다." } = b;

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

    // 1️⃣ 현재 Access Token으로 발행 시도
    let resp = await write(process.env.NAVER_ACCESS_TOKEN);

    // 2️⃣ 만료되었으면 Refresh Token으로 새로 받아서 재시도
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
      const newT = await r.json();
      if (!newT.access_token)
        return res.status(401).send(`<pre>${JSON.stringify(newT, null, 2)}</pre>`);

      resp = await write(newT.access_token);
    }

    const data = await resp.json();
    if (data.message === "success") {
      return res.status(200).send(`
        <h2>✅ 블로그 발행 성공!</h2>
        <p><a href="${data.result.postUrl}" target="_blank">${data.result.postUrl}</a></p>
      `);
    } else {
      return res.status(resp.status).send(`<pre>${JSON.stringify(data, null, 2)}</pre>`);
    }
  } catch (err) {
    return res.status(500).send(`서버 오류: ${err.message}`);
  }
}
