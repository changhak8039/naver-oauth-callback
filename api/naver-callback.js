// /api/naver-callback.js
module.exports = async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code) return res.status(400).send("code 값이 없습니다.");

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.NAVER_CLIENT_ID,
      client_secret: process.env.NAVER_CLIENT_SECRET,
      code,
      state,
    });

    const tokenResponse = await fetch('https://nid.naver.com/oauth2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    const data = await tokenResponse.json();
    console.log('token data:', data);

    res.status(200).json(data);
  } catch (err) {
    console.error('naver-callback error:', err);
    res.status(500).json({ error: err.message });
  }
};
