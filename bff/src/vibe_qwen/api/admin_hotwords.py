"""管理平面 Hotword CRUD（/api/admin/hotwords）：完整形狀與啟用切換、搜尋。

消費端契約端點另見 api/hotwords.py，不與此前綴混用。
"""

from fastapi import APIRouter, Request
from pydantic import BaseModel

from vibe_qwen.persistence.hotwords import HotwordNotFound

router = APIRouter()


class HotwordCreate(BaseModel):
    term: str
    note: str | None = None


class EnabledPatch(BaseModel):
    enabled: bool


@router.post("/api/admin/hotwords", status_code=201)
async def create_hotword(body: HotwordCreate, request: Request) -> dict:
    repo = request.app.state.hotwords
    return {"data": repo.create(term=body.term, note=body.note)}


@router.get("/api/admin/hotwords")
async def list_hotwords(request: Request, q: str | None = None) -> dict:
    repo = request.app.state.hotwords
    return {"data": repo.list_all(query=q)}


@router.put("/api/admin/hotwords/{hid}")
async def update_hotword(hid: str, body: HotwordCreate, request: Request) -> dict:
    repo = request.app.state.hotwords
    updated = repo.update(hid, term=body.term, note=body.note)
    if updated is None:
        raise HotwordNotFound
    return {"data": updated}


@router.patch("/api/admin/hotwords/{hid}/enabled")
async def set_hotword_enabled(hid: str, body: EnabledPatch, request: Request) -> dict:
    repo = request.app.state.hotwords
    updated = repo.set_enabled(hid, body.enabled)
    if updated is None:
        raise HotwordNotFound
    return {"data": updated}


@router.delete("/api/admin/hotwords/{hid}")
async def delete_hotword(hid: str, request: Request) -> dict:
    repo = request.app.state.hotwords
    if not repo.delete(hid):
        raise HotwordNotFound
    return {"data": {"success": True}}
