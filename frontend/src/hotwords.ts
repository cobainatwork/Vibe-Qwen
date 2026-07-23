// 管理平面 Hotword API client 與型別（/api/admin/hotwords，{data} 信封）。
// 狀態變更一律送 application/json 以觸發 CORS 預檢（spec 安全邊界）。

export type Hotword = {
  id: string;
  term: string;
  note: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

const JSON_HEADERS = { "Content-Type": "application/json" };

async function unwrap<T>(resp: Response): Promise<T> {
  if (!resp.ok) {
    throw new Error(`Hotword 請求失敗：HTTP ${resp.status}`);
  }
  const body = (await resp.json()) as { data: T };
  return body.data;
}

export async function listHotwords(q?: string): Promise<Hotword[]> {
  const url = q
    ? `/api/admin/hotwords?q=${encodeURIComponent(q)}`
    : "/api/admin/hotwords";
  return unwrap<Hotword[]>(await fetch(url));
}

export async function createHotword(term: string, note?: string): Promise<Hotword> {
  const resp = await fetch("/api/admin/hotwords", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify({ term, note: note ?? null }),
  });
  return unwrap<Hotword>(resp);
}

export async function updateHotword(
  id: string,
  term: string,
  note?: string,
): Promise<Hotword> {
  const resp = await fetch(`/api/admin/hotwords/${id}`, {
    method: "PUT",
    headers: JSON_HEADERS,
    body: JSON.stringify({ term, note: note ?? null }),
  });
  return unwrap<Hotword>(resp);
}

export async function setHotwordEnabled(id: string, enabled: boolean): Promise<Hotword> {
  const resp = await fetch(`/api/admin/hotwords/${id}/enabled`, {
    method: "PATCH",
    headers: JSON_HEADERS,
    body: JSON.stringify({ enabled }),
  });
  return unwrap<Hotword>(resp);
}

export async function deleteHotword(id: string): Promise<void> {
  const resp = await fetch(`/api/admin/hotwords/${id}`, { method: "DELETE" });
  if (!resp.ok) {
    throw new Error(`Hotword 刪除失敗：HTTP ${resp.status}`);
  }
}
