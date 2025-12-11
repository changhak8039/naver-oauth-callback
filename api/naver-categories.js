// /api/naver-categories.js
export default async function handler(req, res) {
  try {
    const r = await fetch("https://openapi.naver.com/blog/listCategory.json", {
      headers: {
        Authorization: `Bearer ${process.env.NAVER_ACCESS_TOKEN}`,
        Accept: "application/json",
      },
    });

    const data = await r.json();
    res.status(r.ok ? 200 : r.status).json(data);
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
}
