// 健康狀態與四區塊的送出停用規則（純邏輯，供元件與測試共用）。

export type ServiceKey = "asr" | "tts";

export type Health = {
  asr: { ready: boolean };
  tts: { ready: boolean };
};

export type SectionKey = "hotwords" | "asr" | "tts" | "voices";

export const SECTION_ORDER: SectionKey[] = ["hotwords", "asr", "tts", "voices"];

export const SECTIONS: Record<SectionKey, { label: string; requires: ServiceKey[] }> = {
  hotwords: { label: "Hotword 管理", requires: [] },
  asr: { label: "ASR 測試", requires: ["asr"] },
  tts: { label: "TTS 測試", requires: ["tts"] },
  voices: { label: "音色管理", requires: ["tts"] },
};

// 回傳阻擋該區塊送出的首個未就緒服務；皆就緒或無需服務時回 null。
export function findBlockingService(section: SectionKey, health: Health | null): ServiceKey | null {
  for (const svc of SECTIONS[section].requires) {
    if (!health || !health[svc].ready) return svc;
  }
  return null;
}

// US 48：所需模型服務未就緒（或狀態未知）時停用送出。
export function isSubmitDisabled(section: SectionKey, health: Health | null): boolean {
  return findBlockingService(section, health) !== null;
}
