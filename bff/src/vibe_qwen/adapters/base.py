"""AsrClient/TtsClient 介面（ADR-0001 的唯一 stub 邊界）。

#1 walking skeleton 僅需就緒探測 health()。辨識 transcribe() 與合成
synthesize() 隨其對應票（#2/#4）加入本介面。
"""

from typing import Protocol, runtime_checkable


@runtime_checkable
class AsrClient(Protocol):
    async def health(self) -> bool:
        """回報 ASR 模型服務是否就緒。"""
        ...


@runtime_checkable
class TtsClient(Protocol):
    async def health(self) -> bool:
        """回報 TTS 模型服務是否就緒。"""
        ...
