import { useCallback, useEffect, useState } from "react";

import {
  createHotword,
  deleteHotword,
  importHotwords,
  listHotwords,
  previewContext,
  setHotwordEnabled,
  updateHotword,
  type ContextPreview,
  type Hotword,
} from "./hotwords";

export function HotwordsPanel() {
  const [hotwords, setHotwords] = useState<Hotword[]>([]);
  const [query, setQuery] = useState("");
  const [newTerm, setNewTerm] = useState("");
  const [newNote, setNewNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTerm, setEditTerm] = useState("");
  const [editNote, setEditNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ContextPreview | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<string | null>(null);

  const load = useCallback(async (q: string) => {
    try {
      setHotwords(await listHotwords(q || undefined));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hotword 載入失敗");
    }
  }, []);

  useEffect(() => {
    void load(query);
  }, [query, load]);

  // 變更後重新載入清單，並收斂錯誤呈現。
  const run = async (action: () => Promise<unknown>) => {
    try {
      await action();
      setError(null);
      await load(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失敗");
    }
  };

  const startEdit = (h: Hotword) => {
    setEditingId(h.id);
    setEditTerm(h.term);
    setEditNote(h.note ?? "");
  };

  const saveEdit = () =>
    void run(async () => {
      await updateHotword(editingId!, editTerm, editNote);
      setEditingId(null);
    });

  const handlePreview = () =>
    void run(async () => {
      setPreview(await previewContext());
    });

  const handleImport = () => {
    if (!importFile) return;
    const format = importFile.name.toLowerCase().endsWith(".csv") ? "csv" : "json";
    void run(async () => {
      const result = await importHotwords(importFile, format);
      setImportResult(`新增 ${result.created}、更新 ${result.updated}`);
    });
  };

  return (
    <section className="panel">
      <h2 className="panel__title">Hotword 管理</h2>
      <p className="panel__note">
        維護辨識用詞彙清單；啟用中的 term 會於辨識時編譯成 Context prompt 注入 ASR。
      </p>

      {error && <p className="panel__warn">{error}</p>}

      <form
        className="hw-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!newTerm.trim()) return;
          void run(async () => {
            await createHotword(newTerm, newNote);
            setNewTerm("");
            setNewNote("");
          });
        }}
      >
        <input
          className="hw-input"
          aria-label="新增 term"
          placeholder="新增 term（必填）"
          value={newTerm}
          onChange={(e) => setNewTerm(e.target.value)}
        />
        <input
          className="hw-input"
          aria-label="新增 note"
          placeholder="說明（選填）"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
        />
        <button className="btn" type="submit">
          新增
        </button>
      </form>

      <div className="hw-toolbar">
        <a className="hw-link" href="/api/admin/hotwords/export?format=json" download>
          匯出 JSON
        </a>
        <a className="hw-link" href="/api/admin/hotwords/export?format=csv" download>
          匯出 CSV
        </a>
        <input
          type="file"
          aria-label="匯入檔案"
          accept=".csv,.json"
          onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
        />
        <button className="hw-link" type="button" onClick={handleImport}>
          匯入
        </button>
        <button className="hw-link" type="button" onClick={handlePreview}>
          預覽 context
        </button>
      </div>

      {importResult && <p className="panel__note">匯入完成：{importResult}</p>}
      {preview && (
        <div className="hw-preview">
          <p className="panel__note">
            token 估算 {preview.token_estimate} / 上限 {preview.token_budget}
          </p>
          <pre className="hw-preview__text">{preview.context}</pre>
        </div>
      )}

      <input
        className="hw-input hw-search"
        type="search"
        aria-label="搜尋 Hotword"
        placeholder="搜尋 term 或說明"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <table className="hw-table">
        <thead>
          <tr>
            <th scope="col">啟用</th>
            <th scope="col">Term</th>
            <th scope="col">說明</th>
            <th scope="col">操作</th>
          </tr>
        </thead>
        <tbody>
          {hotwords.map((h) => {
            const editing = h.id === editingId;
            return (
              <tr key={h.id}>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`啟用 ${h.term}`}
                    checked={h.enabled}
                    onChange={() => void run(() => setHotwordEnabled(h.id, !h.enabled))}
                  />
                </td>
                <td>
                  {editing ? (
                    <input
                      className="hw-input"
                      aria-label="編輯 term"
                      value={editTerm}
                      onChange={(e) => setEditTerm(e.target.value)}
                    />
                  ) : (
                    h.term
                  )}
                </td>
                <td className="hw-note">
                  {editing ? (
                    <input
                      className="hw-input"
                      aria-label="編輯 note"
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                    />
                  ) : (
                    h.note
                  )}
                </td>
                <td className="hw-actions">
                  {editing ? (
                    <>
                      <button className="hw-link" type="button" onClick={saveEdit}>
                        儲存
                      </button>
                      <button
                        className="hw-link"
                        type="button"
                        onClick={() => setEditingId(null)}
                      >
                        取消
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="hw-link" type="button" onClick={() => startEdit(h)}>
                        編輯
                      </button>
                      <button
                        className="hw-link hw-link--danger"
                        type="button"
                        onClick={() => void run(() => deleteHotword(h.id))}
                      >
                        刪除
                      </button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
          {hotwords.length === 0 && (
            <tr>
              <td className="hw-empty" colSpan={4}>
                尚無 Hotword，於上方新增第一筆。
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
