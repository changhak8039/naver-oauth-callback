// /api/naver-auth.js
module.exports = async (req, res) => {
  try {
    const clientId = process.env.NAVER_CLIENT_ID;
    const redirectUri = encodeURIComponent(process.env.NAVER_REDIRECT_URI);
    const scope = encodeURIComponent('blog.write blog.read');
    const state = Math.random().toString(36).substring(2) + Date.now().toString(36);

    if (!clientId || !redirectUri) {
      throw new Error('환경변수가 누락되었습니다.');
    }

    const url = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=${scope}`;

    res.writeHead(302, { Location: url });
    res.end();
  } catch (err) {
    console.error('naver-auth error:', err);
    res.status(500).json({ error: err.message });
  }
};
