"""健康檢查：回報 ASR 與 TTS 模型服務的就緒狀態（User Story 47）。"""

from fastapi import APIRouter, Request

router = APIRouter()


@router.get("/api/health")
async def health(request: Request) -> dict:
    asr = request.app.state.asr_client
    tts = request.app.state.tts_client
    return {
        "data": {
            "asr": {"ready": await asr.health()},
            "tts": {"ready": await tts.health()},
        }
    }
