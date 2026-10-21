// supabase/functions/ai-clean/index.ts
//
// AI background removal for product photos: receives one original eyeglass
// photo, asks the OpenAI image model to remove the background and place the
// frame on a clean pure white background WITHOUT changing the frame itself,
// and returns the cleaned image as a data URL.
//
// This replaces the manual local rembg step: after an original photo is
// uploaded in the Admin, the "AI 去背" button calls this function and the
// result is saved as a cleaned image (kind='cleaned') for that product.
//
// Security rules (do not weaken):
// - The OpenAI key is read ONLY from the Edge Function secret
//   OPENAI_API_KEY via Deno.env.get. It is never hard-coded, never logged,
//   and never returned to the client.
// - The input photo is held in memory for this request only and never
//   written to storage.
// - Logs carry only minimal status markers, never payloads or keys.
//
// Deploy (run on a machine with the Supabase CLI, from the repo root):
//   supabase link --project-ref ljlckbljjmxilxydblqy
//   supabase functions deploy ai-clean
// Keep the function's default JWT verification ON: the Admin calls it with
// the Supabase anon key, and the gateway validates it first.

const OPENAI_URL = "https://api.openai.com/v1/images/edits";
const MAX_BODY_BYTES = 15 * 1024 * 1024; // data URL input, if used
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
    console.error("ai-clean: OPENAI_API_KEY secret is not set");
    return json(500, { error: "ai_not_configured" });
  }

  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return json(413, { error: "payload_too_large" });
  }

  let body: { imageDataUrl?: unknown; imageUrl?: unknown };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "invalid_json" });
  }

  let frameBlob: Blob | null = null;
  if (typeof body.imageDataUrl === "string") {
    const { blob, ok } = dataUrlToBlob(body.imageDataUrl);
    if (!ok) {
      return json(400, { error: "invalid_image" });
    }
    frameBlob = blob;
  } else if (typeof body.imageUrl === "string" && body.imageUrl.startsWith("https://")) {
    const { blob, ok } = await fetchAsBlob(body.imageUrl);
    if (!ok || !blob) {
      // The Admin's originals live behind 7-day signed URLs; an expired
      // link is the common cause. The client maps this to a re-upload hint.
      return json(400, { error: "original_unreachable" });
    }
    frameBlob = blob;
  } else {
    return json(400, { error: "missing_image" });
  }

  const form = new FormData();
  form.append("model", "gpt-image-1");
  form.append("image[]", frameBlob, "frame.jpg");
  form.append(
    "prompt",
    "Remove the background of this eyeglass product photo and place the eyeglass frame alone, fully visible and centered, on a clean pure white background. " +
      "Do NOT change the frame itself in any way: keep its exact shape, size proportions, colors, patterns, materials, textures, logos, hinges and every small detail identical to the original photo. " +
      "Do not restyle, recolor, redraw or beautify the frame, do not add or remove any part of it, and do not add any other object, text, shadow or watermark. " +
      "The result must look like the same frame photographed against pure white, suitable as a store product image.",
  );
  form.append("size", "1024x1024");
  form.append("output_format", "png");
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
    console.error("ai-clean: openai request failed");
    return json(502, { error: "generation_failed" });
  }
  if (!openaiRes.ok) {
    // Deliberately generic: never forward the provider's error body.
    console.error(`ai-clean: openai status ${openaiRes.status}`);
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
  return json(200, { imageDataUrl: `data:image/png;base64,${b64}` });
});
