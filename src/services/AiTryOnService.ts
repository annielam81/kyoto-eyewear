/**
 * AiTryOnService — AI 自拍试戴。
 *
 * 调用 Supabase Edge Function ai-tryon（服务端持有 OPENAI_API_KEY，前端
 * 永远不接触 Key）。自拍只发给生成接口当次使用，不写入任何存储；
 * 生成结果只保存在内存里，离开试戴页即丢弃。
 */

function supabaseConfig(): { url: string; anonKey: string } | null {
  const env = (import.meta as any).env ?? {};
  const url = env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = env.VITE_SUPABASE_ANON_KEY as string | undefined;
  return url && anonKey ? { url, anonKey } : null;
}

/**
 * chooseImage 得到的临时文件路径 -> data URL。
 * H5：临时路径是 blob URL，用 fetch + FileReader 转；
 * APP / 小程序：走文件系统读 base64。
 */
export async function filePathToDataUrl(path: string): Promise<string> {
  try {
    const res = await fetch(path);
    const blob = await res.blob();
    if (blob && blob.size > 0 && blob.type.startsWith('image/')) {
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('read_failed'));
        reader.readAsDataURL(blob);
      });
    }
  } catch {
    /* 不是 blob URL，走下面的文件系统路径 */
  }
  const fsm = (uni as any).getFileSystemManager?.();
  if (fsm?.readFile) {
    const b64 = await new Promise<string>((resolve, reject) => {
      fsm.readFile({
        filePath: path,
        encoding: 'base64',
        success: (r: any) => resolve(String(r.data)),
        fail: () => reject(new Error('read_failed')),
      });
    });
    return `data:image/jpeg;base64,${b64}`;
  }
  throw new Error('read_failed');
}

export type AiTryOnErrorCode =
  | 'ai_not_configured'
  | 'ai_busy'
  | 'generation_failed'
  | 'network'
  | 'read_failed';

/** 生成一张 AI 试戴图，返回图片 data URL。失败时抛出 code 即上述其一。 */
export async function generateAiTryOn(
  selfiePath: string,
  frameImageUrl?: string,
): Promise<string> {
  const cfg = supabaseConfig();
  if (!cfg) throw new Error('ai_not_configured' satisfies AiTryOnErrorCode);
  const selfieDataUrl = await filePathToDataUrl(selfiePath);
  const res = await new Promise<any>((resolve, reject) => {
    uni.request({
      url: `${cfg.url}/functions/v1/ai-tryon`,
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        apikey: cfg.anonKey,
        Authorization: `Bearer ${cfg.anonKey}`,
      },
      data: { selfieDataUrl, frameImageUrl: frameImageUrl || undefined },
      success: (r: any) => resolve(r),
      fail: () => reject(new Error('network' satisfies AiTryOnErrorCode)),
    });
  });
  if (res?.statusCode === 200 && res?.data?.imageDataUrl) {
    return String(res.data.imageDataUrl);
  }
  const code = res?.data?.error as string | undefined;
  if (code === 'ai_busy') throw new Error('ai_busy' satisfies AiTryOnErrorCode);
  if (code === 'ai_not_configured') {
    throw new Error('ai_not_configured' satisfies AiTryOnErrorCode);
  }
  throw new Error('generation_failed' satisfies AiTryOnErrorCode);
}
