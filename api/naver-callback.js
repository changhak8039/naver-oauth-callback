export default async function handler(req, res) {
  const { code, state } = req.query;

  const tokenRes = await fetch('https://nid.naver.com/oauth2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.NAVER_CLIENT_ID,
      client_secret: process.env.NAVER_CLIENT_SECRET,
      code,
      state,
    }),
  });

  const token = await tokenRes.json();
  const access = token.access_token || '';

  // 쿠키 저장(브라우저에서 API 호출 시 자동으로 사용됨)
  res.setHeader('Set-Cookie', [
    `access_token=${encodeURIComponent(access)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`,
  ]);

  // 원하는 위치로 리다이렉트 (예: 카테고리 즉시 확인)
  res.writeHead(302, { Location: '/api/naver-categories' });
  res.end();
}
