# Voice design 音色建立時定版

## Status

accepted

## Decision

建立 Voice design 音色時執行一次生成、擷取輸出音檔存為參考音（定版），之後一律以 Voice clone 路徑重播該參考音，而非每次測試都用原描述即時重新生成。

## Consequences

- Voice design 與 Voice clone 共用同一套儲存與播放路徑（參考音檔加 metadata），資料模型一致。
- 音色可穩定重現，符合測試/管理工具對可重現性的需求。
- 代價：原始文字描述在定版後不再驅動生成，僅作為 metadata 保留；若要調整音色需重新建立並重新定版。
