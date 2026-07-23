"""Hotword 文字清洗（spec：Hotword 內容為不可信輸入）。

剝除可能與底層 ASR／LLM 特殊 token 衝突的保留標記（<|...|>，含語者與
時間戳標記）與控制字元，使 term 注入 context 時以字面 tokenize，不致
被解讀為特殊 token 而破壞 prompt template 或 Who/When/What 的 JSON 結構。
"""

import re
import unicodedata


class InvalidHotwordTerm(ValueError):
    """term 清洗後為空，無有效內容可儲存。"""


# <|...|> 特殊 token 標記（語者、時間戳等），整段移除。
_SPECIAL_TOKEN = re.compile(r"<\|.*?\|>")


def sanitize_text(raw: str) -> str:
    without_tokens = _SPECIAL_TOKEN.sub("", raw)
    without_controls = "".join(
        ch for ch in without_tokens if unicodedata.category(ch) != "Cc"
    )
    return without_controls.strip()


def clean_term(raw: str) -> str:
    """清洗 term；若清洗後無有效內容則 raise InvalidHotwordTerm。"""
    term = sanitize_text(raw)
    if not term:
        raise InvalidHotwordTerm
    return term
