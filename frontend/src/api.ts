import type { Health } from "./health";

// 呼叫 BFF 健康檢查；成功回應為 { data: Health } 信封。
export async function fetchHealth(): Promise<Health> {
  const resp = await fetch("/api/health");
  if (!resp.ok) {
    throw new Error(`健康檢查失敗：HTTP ${resp.status}`);
  }
  const body = (await resp.json()) as { data: Health };
  return body.data;
}
