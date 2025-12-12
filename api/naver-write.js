// /api/naver-write.js
export default async function handler(req, res) {
  try {
    // 1️⃣ 토큰 안전하게 가져오기
    const rawAuth = req.headers.authorization || '';
    const headerToken = rawAuth.startsWith('Bearer ') ? rawAuth.slice(7) : '';
    const token = (
      headerToken ||
      req.query.access_token ||
      req.cookies?.access_token ||
      ''
    )
      .toString()
      .trim();

    // 비ASCII 문자 있으면 헤더로 못 보냄
    if (!token || /[^\x00-\xFF]/.test(token)) {
      return res.status(401).json({ ok: false, error: 'NO_OR_INVALID_TOKEN' });
    }

    // 2️⃣ 요청 본문 파라미터
    const { title, contents, categoryNo = 0, tag = [] } = req.body || {};
    const tags = Array.isArray(tag) ? tag.join(',') : tag || '';

    // 3️⃣ 네이버 블로그 글쓰기 API (x-www-form-urlencoded)
    const form = new URLSearchParams({
      title: title || '테스트 제목',
      contents: contents || '<p>본문 내용</p>',
      categoryNo: categoryNo.toString(),
      tag: tags,
    });

    const r = await fetch('https://openapi.naver.com/blog/writePost.json', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      body: form,
    });

    const data = await r.json();
    return res.status(200).json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}
