import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createHotword,
  deleteHotword,
  importHotwords,
  listHotwords,
  previewContext,
  setHotwordEnabled,
} from "./hotwords";

function mockFetch(data: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({ ok, status, json: async () => ({ data }) });
}

describe("hotwords API client", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("listHotwords 解析 {data} 信封為陣列", async () => {
    const rows = [
      { id: "1", term: "台積電", note: null, enabled: true, created_at: "t", updated_at: "t" },
    ];
    vi.stubGlobal("fetch", mockFetch(rows));

    await expect(listHotwords()).resolves.toEqual(rows);
  });

  it("listHotwords 帶搜尋字串時以 q 參數查詢（跳脫）", async () => {
    const fetchMock = mockFetch([]);
    vi.stubGlobal("fetch", fetchMock);

    await listHotwords("台積");

    expect(fetchMock.mock.calls[0][0]).toBe(
      `/api/admin/hotwords?q=${encodeURIComponent("台積")}`,
    );
  });

  it("createHotword 以 JSON body POST term 與 note", async () => {
    const fetchMock = mockFetch({ id: "1", term: "x", note: "n" });
    vi.stubGlobal("fetch", fetchMock);

    await createHotword("x", "n");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/admin/hotwords");
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(init.body)).toEqual({ term: "x", note: "n" });
  });

  it("setHotwordEnabled 以 PATCH 送目標 enabled 值", async () => {
    const fetchMock = mockFetch({ id: "1", enabled: false });
    vi.stubGlobal("fetch", fetchMock);

    await setHotwordEnabled("1", false);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/admin/hotwords/1/enabled");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body)).toEqual({ enabled: false });
  });

  it("deleteHotword 以 DELETE 呼叫指定 id", async () => {
    const fetchMock = mockFetch({ success: true });
    vi.stubGlobal("fetch", fetchMock);

    await deleteHotword("abc");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/admin/hotwords/abc");
    expect(init.method).toBe("DELETE");
  });

  it("非 2xx 回應時拋出錯誤", async () => {
    vi.stubGlobal("fetch", mockFetch(null, false, 400));

    await expect(createHotword("x")).rejects.toThrow();
  });

  it("previewContext 解析 {data} 信封", async () => {
    const preview = { context: "台積電、聯發科", token_estimate: 6, token_budget: 8000 };
    vi.stubGlobal("fetch", mockFetch(preview));

    await expect(previewContext()).resolves.toEqual(preview);
  });

  it("previewContext 超標 413 時拋出帶訊息的錯誤", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 413,
        json: async () => ({ error: { message: "context 超過上限" } }),
      }),
    );

    await expect(previewContext()).rejects.toThrow("context 超過上限");
  });

  it("importHotwords 以 multipart POST 檔案並回 {created, updated}", async () => {
    const fetchMock = mockFetch({ created: 2, updated: 1 });
    vi.stubGlobal("fetch", fetchMock);
    const file = new File(["[]"], "h.json", { type: "application/json" });

    const result = await importHotwords(file, "json");

    expect(result).toEqual({ created: 2, updated: 1 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/admin/hotwords/import?format=json");
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);
  });
});
