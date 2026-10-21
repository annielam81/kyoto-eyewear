/**
 * AiCleanService — AI 自动去背。
 *
 * 调用 Supabase Edge Function ai-clean（服务端持有 OPENAI_API_KEY，前端
 * 永远不接触 Key）。输入一张原图，返回白底去背后的图片 data URL；
 * 调用方（ProductEditor）再把结果以 kind='cleaned' 入库，顾客端显示。
 * 原图本身不经过本服务做任何存档处理。
 */

function supabaseConfig(): { url: string; anonKey: string } | null {
  const env = (import.meta as any).env ?? {};
  const url = env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = env.VITE_SUPABASE_ANON_KEY as string | undefined;
  return url && anonKey ? { url, anonKey } : null;
}

export type AiCleanErrorCode =
  | 'ai_not_configured'
  | 'ai_busy'
  | 'generation_failed'
  | 'original_unreachable'
  | 'invalid_image'
  | 'network';

/** 原图去背，返回白底图的 data URL。失败时抛出 code 即上述其一。 */
export async function removeBackground(input: {
  imageDataUrl?: string;
  imageUrl?: string;
}): Promise<string> {
  const cfg = supabaseConfig();
  if (!cfg) throw new Error('ai_not_configured' satisfies AiCleanErrorCode);
  let res: Response;
  try {
    res = await fetch(`${cfg.url}/functions/v1/ai-clean`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: cfg.anonKey,
        Authorization: `Bearer ${cfg.anonKey}`,
      },
      body: JSON.stringify(input),
    });
  } catch {
    throw new Error('network' satisfies AiCleanErrorCode);
  }
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* 非 JSON 响应按失败处理 */
  }
  if (res.ok && data?.imageDataUrl) {
    return String(data.imageDataUrl);
  }
  const code = data?.error as string | undefined;
  if (
    code === 'ai_busy' ||
    code === 'ai_not_configured' ||
    code === 'original_unreachable' ||
    code === 'invalid_image'
  ) {
    throw new Error(code satisfies AiCleanErrorCode);
  }
  throw new Error('generation_failed' satisfies AiCleanErrorCode);
}
