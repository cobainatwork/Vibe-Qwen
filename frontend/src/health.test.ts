import { describe, expect, it } from "vitest";

import { isSubmitDisabled, type Health } from "./health";

describe("isSubmitDisabled", () => {
  it("不需模型服務的區塊永不因就緒狀態停用", () => {
    expect(isSubmitDisabled("hotwords", null)).toBe(false);
  });

  it("健康狀態未知時，需模型服務的區塊停用送出", () => {
    expect(isSubmitDisabled("asr", null)).toBe(true);
    expect(isSubmitDisabled("tts", null)).toBe(true);
  });

  it("依所需服務就緒狀態決定停用", () => {
    const health: Health = { asr: { ready: false }, tts: { ready: true } };
    expect(isSubmitDisabled("asr", health)).toBe(true); // 需 asr，未就緒
    expect(isSubmitDisabled("tts", health)).toBe(false); // 需 tts，已就緒
    expect(isSubmitDisabled("voices", health)).toBe(false); // 需 tts，已就緒
  });
});
