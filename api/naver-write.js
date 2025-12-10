// /api/naver-write.js
// 헤더/바디로 받은 토큰을 우선 사용하고, 없으면 환경변수 사용

const asForm = (obj = {}) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) if (v !== undefined && v !== null) p.append(k, String(v));
  return p.toString();
};

function pickTokens(req, body) {
  // 헤더 우선, 바디 그 다음, 마지막은 env
  const accessFromHeader = req.headers['x-access-token'];
  const refreshFromHeader = req.headers['x-refresh-token'];

  const accessFromBody = body?.accessToken;
  const refreshFromBody = body?.refreshToken;

  const accessFromEnv = process.env.NAVER_ACCESS_TOKEN;
  const refreshFromEnv = process.env.NAVER_REFRESH_TOKEN;

  const access =
    accessFromHeader || accessFromBody || accessFromEnv || null;
  const refresh =
    refreshFromHeader || refreshFromBody || refreshFromEnv || null;

  const usedAccessSource = accessFromHeader
    ? 'header'
    : accessFromBody
    ? 'body'
    : accessFromEnv
    ? 'env'
    : 'none';

  return { access, refresh, usedAccessSource };
}

async function writePost(accessToken, { title, contents, categoryNo }) {
  const payload = {
    title: title || '테스트 제목',
    contents: contents || '테스트 본문',
  };
  if (categoryNo) payload.categoryNo = String(categoryNo);

  const r = await fetch('https://openapi.naver.com/v1/blog/writePost.json', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: asForm(payload),
  });

  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, data };
}

async function refreshAccessToken(refreshToken) {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: process.env.NAVER_CLIENT_ID,
    client_secret: process.env.NAVER_CLIENT_SECRET,
    refresh_token: refreshToken,
  });

  const rr = await fetch('https://nid.naver.com/oauth2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const json = await rr.json().catch(() => ({}));
  return { ok: rr.ok, status: rr.status, json };
}

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).send('POST만 지원합니다.');

    const body = typeof req.body === 'string'
      ? JSON.parse(req.body || '{}')
      : (req.body || {});

    const { title, contents, categoryNo } = body;

    const { access, refresh, usedAccessSource } = pickTokens(req, body);

    if (!access) {
      return res.status(400).json({
        error: 'no_access_token',
        hint: 'x-access-token 헤더 또는 body.accessToken 필드로 전달하거나, 환경변수 NAVER_ACCESS_TOKEN을 설정하세요.',
      });
    }

    // 1차 글쓰기
    let result = await writePost(access, { title, contents, categoryNo });

    // 만료 등으로 401이면 refresh 시도
    if (!result.ok && result.status === 401 && refresh) {
      const fr = await refreshAccessToken(refresh);
      if (fr.ok && fr.json?.access_token) {
        const newAccess = fr.json.access_token;
        result = await writePost(newAccess, { title, contents, categoryNo });
        return res.status(result.ok ? 200 : 400).json({
          ...result,
          refreshTried: true,
          new_access_token: newAccess, // 필요 시 이걸 환경변수로 교체
          usedAccessSource,
        });
      }
      return res.status(401).json({
        error: 'refresh_failed',
        details: fr.json,
        usedAccessSource,
      });
    }

    return res.status(result.ok ? 200 : 400).json({
      ...result,
      usedAccessSource,
    });
  } catch (e) {
    console.error('naver-write error:', e);
    return res.status(500).json({ error: e.message || 'write_failed' });
  }
};
