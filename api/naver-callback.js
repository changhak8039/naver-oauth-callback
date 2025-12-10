module.exports = async (req, res) => { ... }
  try {
    const { code, state } = req.query;
    if (!code) return res.status(400).send("code 값이 없습니다.");

    const params = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.NAVER_CLIENT_ID,
      client_secret: process.env.NAVER_CLIENT_SECRET,
      code,
      state
    });

    const r = await fetch("https://nid.naver.com/oauth2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
      body: params
    });

    const data = await r.json();

    if (data.access_token) {
      return res.status(200).send(`
        <h2>✅ 네이버 로그인 성공!</h2>
        <p><b>Access Token:</b> ${data.access_token}</p>
        <p><b>Refresh Token:</b> ${data.refresh_token ?? "-"}</p>
        <p>이제 이 토큰으로 네이버 블로그 자동 글쓰기를 진행할 수 있습니다.</p>
      `);
    }

    return res.status(500).send(
      `<h3>❌ 토큰 발급 실패</h3><pre>${JSON.stringify(data, null, 2)}</pre>`
    );
  } catch (e) {
    return res.status(500).send(`서버 오류: ${e?.message ?? e}`);
  }
}
