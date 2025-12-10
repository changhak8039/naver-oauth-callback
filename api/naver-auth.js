export default async function handler(req, res) {
  const clientId = process.env.NAVER_CLIENT_ID;
  const redirectUri = encodeURIComponent(process.env.NAVER_REDIRECT_URI);
  const scope = encodeURIComponent('blog.write blog.read');

  // 간단한 state 생성 + 쿠키 저장(테스트용)
  const state = Math.random().toString(36).slice(2) + Date.now().toString(36);
  res.setHeader('Set-Cookie', `naver_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);

  const url =
    `https://nid.naver.com/oauth2.0/authorize` +
    `?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=${scope}`;

  res.redirect(url);
}
