"""Configuration loader supporting YAML (via PyYAML or stdlib fallback) and JSON."""

from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Any

AUTOMATION_ROOT = Path(__file__).resolve().parents[2]
REPO_ROOT = AUTOMATION_ROOT.parent


def expand_env_path(raw: str) -> Path:
    expanded = os.path.expandvars(raw)
    # Also expand Windows %VAR% style when running on non-Windows tests
    def _repl(match: re.Match[str]) -> str:
        return os.environ.get(match.group(1), match.group(0))

    expanded = re.sub(r"%([^%]+)%", _repl, expanded)
    return Path(expanded).expanduser()


def _parse_scalar(text: str) -> Any:
    s = text.strip()
    if not s:
        return ""
    if (s.startswith('"') and s.endswith('"')) or (s.startswith("'") and s.endswith("'")):
        if s.startswith('"'):
            return json.loads(s)
        return s[1:-1]
    low = s.lower()
    if low in {"null", "~"}:
        return None
    if low == "true":
        return True
    if low == "false":
        return False
    if s.startswith("[") and s.endswith("]"):
        inner = s[1:-1].strip()
        if not inner:
            return []
        return [_parse_scalar(part) for part in _split_inline_list(inner)]
    if re.fullmatch(r"0x[0-9a-fA-F]+", s):
        return int(s, 16)
    if re.fullmatch(r"-?[0-9]+", s):
        return int(s)
    if re.fullmatch(r"-?[0-9]+\.[0-9]+", s):
        return float(s)
    return s


def _split_inline_list(inner: str) -> list[str]:
    parts: list[str] = []
    cur: list[str] = []
    quote: str | None = None
    for ch in inner:
        if quote:
            cur.append(ch)
            if ch == quote:
                quote = None
        else:
            if ch in {'"', "'"}:
                quote = ch
                cur.append(ch)
            elif ch == ",":
                parts.append("".join(cur).strip())
                cur = []
            else:
                cur.append(ch)
    if cur:
        parts.append("".join(cur).strip())
    return parts


def _strip_yaml_comment(line: str) -> str:
    quote: str | None = None
    escaped = False
    for idx, ch in enumerate(line):
        if escaped:
            escaped = False
            continue
        if ch == "\\" and quote == '"':
            escaped = True
            continue
        if quote:
            if ch == quote:
                quote = None
        else:
            if ch in {'"', "'"}:
                quote = ch
            elif ch == "#" and (idx == 0 or line[idx - 1].isspace()):
                return line[:idx]
    return line


def _fallback_yaml_load(content: str) -> dict[str, Any]:
    """Minimal indentation-based YAML loader covering configs/*.yaml when PyYAML is absent."""
    lines: list[tuple[int, str]] = []
    for raw_line in content.splitlines():
        cleaned = _strip_yaml_comment(raw_line).rstrip()
        if not cleaned.strip():
            continue
        indent = len(cleaned) - len(cleaned.lstrip(" "))
        lines.append((indent, cleaned.lstrip(" ")))

    def parse_block(idx: int, min_indent: int) -> tuple[Any, int]:
        if idx >= len(lines):
            return {}, idx
        indent, text = lines[idx]
        if text.startswith("- "):
            arr: list[Any] = []
            while idx < len(lines) and lines[idx][0] == indent and lines[idx][1].startswith("- "):
                item_text = lines[idx][1][2:].strip()
                idx += 1
                if ":" in item_text and not item_text.startswith(('"', "'")):
                    k, _, v = item_text.partition(":")
                    obj: dict[str, Any] = {k.strip(): _parse_scalar(v) if v.strip() else None}
                    while idx < len(lines) and lines[idx][0] > indent:
                        sub_indent = lines[idx][0]
                        sub_text = lines[idx][1]
                        sk, _, sv = sub_text.partition(":")
                        sk = sk.strip()
                        sv = sv.strip()
                        idx += 1
                        if sv:
                            obj[sk] = _parse_scalar(sv)
                        elif idx < len(lines) and lines[idx][0] > sub_indent:
                            val, idx = parse_block(idx, sub_indent + 1)
                            obj[sk] = val
                        else:
                            obj[sk] = None
                    arr.append(obj)
                else:
                    arr.append(_parse_scalar(item_text))
            return arr, idx

        mapping: dict[str, Any] = {}
        while idx < len(lines) and lines[idx][0] >= min_indent:
            cur_indent, cur_text = lines[idx]
            if cur_indent > indent:
                break
            if cur_text.startswith("- "):
                break
            key, _, val_part = cur_text.partition(":")
            key = key.strip()
            val_part = val_part.strip()
            idx += 1
            if val_part:
                mapping[key] = _parse_scalar(val_part)
            elif idx < len(lines) and lines[idx][0] > cur_indent:
                child, idx = parse_block(idx, cur_indent + 1)
                mapping[key] = child
            else:
                mapping[key] = None
        return mapping, idx

    parsed, _ = parse_block(0, 0)
    if not isinstance(parsed, dict):
        raise ValueError("Top-level configuration must be a mapping.")
    return parsed


def load_config(path: str | Path) -> dict[str, Any]:
    cfg_path = Path(path)
    if not cfg_path.exists():
        raise FileNotFoundError(f"Config file not found: {cfg_path}")
    text = cfg_path.read_text(encoding="utf-8")
    if cfg_path.suffix.lower() == ".json":
        return json.loads(text)
    try:
        import yaml  # type: ignore

        data = yaml.safe_load(text)
        return data if isinstance(data, dict) else {}
    except ImportError:
        return _fallback_yaml_load(text)


def default_game_config_path(game_key: str) -> Path:
    return AUTOMATION_ROOT / "configs" / f"{game_key.lower()}.yaml"
