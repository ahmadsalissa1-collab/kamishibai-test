// Concept test only: reads/writes TEST values in Netlify Blobs. No real data.
import { getStore } from "@netlify/blobs";

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export default async (req) => {
  const store = getStore({ name: "kb-concept-test", consistency: "strong" });
  try {
    if (req.method === "POST") {
      const body = await req.json();
      const key = String(body.key || ("t-" + Date.now()));
      await store.setJSON(key, { value: body.value ?? null, at: new Date().toISOString() });
      return json({ ok: true, key });
    }
    if (req.method === "DELETE") {
      const { blobs } = await store.list();
      await Promise.all(blobs.map((b) => store.delete(b.key)));
      return json({ ok: true, deleted: blobs.length });
    }
    // GET: list all test items
    const { blobs } = await store.list();
    const items = await Promise.all(
      blobs.map(async (b) => ({ key: b.key, ...(await store.get(b.key, { type: "json" })) }))
    );
    return json({ ok: true, count: items.length, items });
  } catch (e) {
    return json({ ok: false, error: String(e && e.message ? e.message : e) }, 500);
  }
};

export const config = { path: "/api/ping" };
