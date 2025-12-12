export default async function handler(req, res) {
  try {
    // 1) 토큰을 세 가지 경로에서 안전하게 수집
    const rawAuth = req.headers.authorization || '';
    const headerToken = rawAuth.startsWith('Bearer ') ? rawAuth.slice(7) : '';
    const token = (headerToken || req.query.access_token || req.cookies?.access_token || '')
      .toString()
      .trim();

    // 2) 비ASCII(라틴-1 범위 밖) 문자가 있으면 헤더로 못 보냄
    if (!token || /[^\x00-\xFF]/.test(token)) {
      return res.status(401).json({ ok: false, error: 'NO_OR_INVALID_TOKEN' });
    }

    // 3) 네이버 카테고리 호출
    const r = await fetch('https://openapi.naver.com/blog/listCategory.json', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await r.json();
    return res.status(200).json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}
