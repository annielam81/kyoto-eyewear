// supabase/functions/ai-tryon/index.ts
//
// AI selfie try-on: receives a customer selfie + a frame photo, asks the
// OpenAI image model to render the same person wearing that frame, and
// returns the generated image as a data URL.
//
// Security rules (do not weaken):
// - The OpenAI key is read ONLY from the Edge Function secret
//   OPENAI_API_KEY via Deno.env.get. It is never hard-coded, never logged,
//   and never returned to the client.
// - Customer selfies are NOT persisted anywhere: they are held in memory
//   for this request only and never written to storage.
// - Logs carry only minimal status markers, never payloads or keys.
//
// Deploy (run on a machine with the Supabase CLI, from the repo root):
//   supabase link --project-ref ljlckbljjmxilxydblqy
//   supabase functions deploy ai-tryon
// Keep the function's default JWT verification ON: the customer app calls
// it with the Supabase anon key, and the gateway validates it first.

const OPENAI_URL = "https://api.openai.com/v1/images/edits";
const MAX_BODY_BYTES = 15 * 1024 * 1024; // selfie data URL + frame URL
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 20000;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

function dataUrlToBlob(dataUrl: string): { blob: Blob; ok: boolean } {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) return { blob: new Blob(), ok: false };
  const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_IMAGE_BYTES) {
    return { blob: new Blob(), ok: false };
  }
  return { blob: new Blob([bytes], { type: m[1] }), ok: true };
}

async function fetchAsBlob(url: string): Promise<{ blob: Blob | null; ok: boolean }> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !type.startsWith("image/")) return { blob: null, ok: false };
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength === 0 || buf.byteLength > MAX_IMAGE_BYTES) {
      return { blob: null, ok: false };
    }
    const mime = type.split(";")[0].trim();
    const safeMime = ["image/jpeg", "image/png", "image/webp"].includes(mime)
      ? mime
      : "image/jpeg";
    return { blob: new Blob([buf], { type: safeMime }), ok: true };
  } catch {
    return { blob: null, ok: false };
  }
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (req.method !== "POST") {
    return json(405, { error: "method_not_allowed" });
  }

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    console.error("ai-tryon: OPENAI_API_KEY secret is not set");
    return json(500, { error: "ai_not_configured" });
  }

  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return json(413, { error: "payload_too_large" });
  }

  let body: { selfieDataUrl?: unknown; frameImageUrl?: unknown };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "invalid_json" });
  }
  if (typeof body.selfieDataUrl !== "string") {
    return json(400, { error: "missing_selfie" });
  }
  const { blob: selfieBlob, ok: selfieOk } = dataUrlToBlob(body.selfieDataUrl);
  if (!selfieOk) {
    return json(400, { error: "invalid_selfie" });
  }

  const form = new FormData();
  form.append("model", "gpt-image-1");
  form.append("image[]", selfieBlob, "selfie.jpg");
  let hasFrameRef = false;
  if (typeof body.frameImageUrl === "string" && body.frameImageUrl.startsWith("https://")) {
    const { blob: frameBlob, ok: frameOk } = await fetchAsBlob(body.frameImageUrl);
    if (frameOk && frameBlob) {
      form.append("image[]", frameBlob, "frame.jpg");
      hasFrameRef = true;
    }
    // If the frame photo cannot be fetched, fall back to a selfie-only edit
    // rather than failing the request; the prompt below covers that case.
  }
  form.append(
    "prompt",
    hasFrameRef
      ? "Edit the first image (a selfie) so the same person is wearing the eyeglass frame shown in the second reference image. " +
        "Preserve the person's face, identity, skin tone, hairstyle, expression, lighting and background exactly. " +
        "Place the frames naturally on the face, aligned with the eyes, with realistic proportions and temple arms going back over the ears. " +
        "Photorealistic, no text, no watermark. This is a style preview of eyewear, not a measurement of fit."
      : "Edit this selfie so the same person is wearing a classic modern eyeglass frame. " +
        "Preserve the person's face, identity, skin tone, hairstyle, expression, lighting and background exactly. " +
        "Place the frames naturally on the face, aligned with the eyes, with realistic proportions and temple arms going back over the ears. " +
        "Photorealistic, no text, no watermark. This is a style preview of eyewear, not a measurement of fit.",
  );
  form.append("size", "1024x1024");
  form.append("quality", "medium");
  form.append("output_format", "jpeg");
  form.append("input_fidelity", "high");

  let openaiRes: Response;
  try {
    openaiRes = await fetch(OPENAI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: AbortSignal.timeout(120000),
    });
  } catch {
    console.error("ai-tryon: openai request failed");
    return json(502, { error: "generation_failed" });
  }
  if (!openaiRes.ok) {
    // Deliberately generic: never forward the provider's error body.
    console.error(`ai-tryon: openai status ${openaiRes.status}`);
    if (openaiRes.status === 429) return json(429, { error: "ai_busy" });
    return json(502, { error: "generation_failed" });
  }

  let result: { data?: Array<{ b64_json?: string }> };
  try {
    result = await openaiRes.json();
  } catch {
    return json(502, { error: "generation_failed" });
  }
  const b64 = result.data?.[0]?.b64_json;
  if (!b64) {
    return json(502, { error: "generation_failed" });
  }
  return json(200, { imageDataUrl: `data:image/jpeg;base64,${b64}` });
});
