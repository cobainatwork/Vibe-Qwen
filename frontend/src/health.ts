// 健康狀態與四區塊的送出停用規則（純邏輯，供元件與測試共用）。

export type ServiceKey = "asr" | "tts";

export type Health = {
  asr: { ready: boolean };
  tts: { ready: boolean };
};

export type SectionKey = "hotwords" | "asr" | "tts" | "voices";

export const SECTIONS: {
  key: SectionKey;
  label: string;
  requires: ServiceKey[];
}[] = [
  { key: "hotwords", label: "Hotword 管理", requires: [] },
  { key: "asr", label: "ASR 測試", requires: ["asr"] },
  { key: "tts", label: "TTS 測試", requires: ["tts"] },
  { key: "voices", label: "音色管理", requires: ["tts"] },
];

// US 48：健康狀態未知，或該區塊所需模型服務未就緒時，停用送出。
export function isSubmitDisabled(section: SectionKey, health: Health | null): boolean {
  const requires = SECTIONS.find((s) => s.key === section)?.requires ?? [];
  if (requires.length === 0) return false;
  if (!health) return true;
  return requires.some((svc) => !health[svc].ready);
}
