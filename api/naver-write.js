export default async function handler(req, res) {
  // CORS (브라우저 콘솔에서 테스트할 때 편의를 위해)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-access-token, x-refresh-token');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok:false, message:'POST only' });

  const access =
    req.headers['x-access-token'] ||
    req.body?.access_token ||
    process.env.NAVER_ACCESS_TOKEN;

  const refresh =
    req.headers['x-refresh-token'] ||
    req.body?.refresh_token ||
    process.env.NAVER_REFRESH_TOKEN;

  const { title, contents, categoryNo, tags } = req.body || {};

  // 네이버 블로그 글쓰기 API는 x-www-form-urlencoded 형식
  const form = new URLSearchParams();
  form.append('title', title || '테스트');
  form.append('contents', contents || '본문');
  if (categoryNo) form.append('categoryNo', String(categoryNo));
  if (tags) form.append('tag', Array.isArray(tags) ? tags.join(',') : String(tags));

  const endpoint = 'https://openapi.naver.com/blog/writePost.json'; // ← 정확한 경로

  try {
    const r = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access}`,
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      body: form,
    });

    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    return res.status(r.status).json({
      ok: r.ok,
      status: r.status,
      endpoint,
      usedAccessSource: access ? 'header/env/body' : 'none',
      naver: data,
    });
  } catch (e) {
    return res.status(500).json({ ok:false, error:String(e) });
  }
}
