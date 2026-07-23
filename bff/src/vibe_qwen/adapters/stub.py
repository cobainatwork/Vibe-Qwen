"""離線 stub adapter：供無 GPU 開發與測試使用，回傳固定假結果。"""


class StubAsrClient:
    def __init__(self, ready: bool = True) -> None:
        self._ready = ready

    async def health(self) -> bool:
        return self._ready


class StubTtsClient:
    def __init__(self, ready: bool = True) -> None:
        self._ready = ready

    async def health(self) -> bool:
        return self._ready
