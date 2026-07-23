"""BFF 應用工廠。模型呼叫一律經注入的 AsrClient/TtsClient adapter。"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse

from vibe_qwen.adapters.base import AsrClient, TtsClient
from vibe_qwen.adapters.stub import StubAsrClient, StubTtsClient
from vibe_qwen.api.admin_hotwords import router as admin_hotwords_router
from vibe_qwen.api.health import router as health_router
from vibe_qwen.api.hotwords import router as hotwords_router
from vibe_qwen.config import Settings
from vibe_qwen.files.cleanup import cleanup_expired_temp_files
from vibe_qwen.hotword_text import InvalidHotwordTerm
from vibe_qwen.middleware.limits import HeavyRequestGuard, HeavyRequestRejected
from vibe_qwen.middleware.origin import OriginGuardMiddleware
from vibe_qwen.persistence.hotwords import HotwordNotFound, HotwordRepository


def create_app(
    asr_client: AsrClient | None = None,
    tts_client: TtsClient | None = None,
    settings: Settings | None = None,
) -> FastAPI:
    settings = settings or Settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        cleanup_expired_temp_files(settings.temp_dir, settings.temp_max_age_seconds)
        yield

    app = FastAPI(title="Vibe-Qwen BFF", lifespan=lifespan)
    app.state.settings = settings
    app.state.asr_client = asr_client or StubAsrClient()
    app.state.tts_client = tts_client or StubTtsClient()
    app.state.hotwords = HotwordRepository(settings.db_path)
    app.state.heavy_guard = HeavyRequestGuard(
        max_concurrent=settings.max_concurrent_heavy_requests,
        timeout_seconds=settings.request_timeout_seconds,
    )

    async def _on_heavy_rejected(request, exc: HeavyRequestRejected) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": {"code": exc.code, "message": exc.message}},
        )

    app.add_exception_handler(HeavyRequestRejected, _on_heavy_rejected)

    async def _on_invalid_term(request, exc: InvalidHotwordTerm) -> JSONResponse:
        return JSONResponse(
            status_code=400,
            content={
                "error": {
                    "code": "INVALID_HOTWORD_TERM",
                    "message": "Hotword term 清洗後無有效內容，請提供有效詞彙。",
                }
            },
        )

    app.add_exception_handler(InvalidHotwordTerm, _on_invalid_term)

    async def _on_hotword_not_found(request, exc: HotwordNotFound) -> JSONResponse:
        return JSONResponse(
            status_code=404,
            content={"error": {"code": "HOTWORD_NOT_FOUND", "message": "找不到指定的 Hotword。"}},
        )

    app.add_exception_handler(HotwordNotFound, _on_hotword_not_found)

    async def _on_validation_error(request, exc: RequestValidationError) -> JSONResponse:
        # spec：格式或欄位驗證失敗回 400，並統一為 {error:{code,message}} 信封。
        return JSONResponse(
            status_code=400,
            content={"error": {"code": "VALIDATION_ERROR", "message": "請求內容驗證失敗。"}},
        )

    app.add_exception_handler(RequestValidationError, _on_validation_error)

    app.add_middleware(OriginGuardMiddleware, allowed_origins=settings.allowed_origins)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,  # 顯式清單，不用萬用字元 *
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(health_router)
    app.include_router(hotwords_router)
    app.include_router(admin_hotwords_router)
    return app
