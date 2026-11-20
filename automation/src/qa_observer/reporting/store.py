"""Validated idempotent JSON store manager for web/data/automation-runs.json."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from qa_observer.schema import empty_store, utc_now_iso, validate_run_dict, validate_store_dict


def load_store(store_path: str | Path, repo: str = "supercoko/Game_QA_Experience_Web") -> dict[str, Any]:
    path = Path(store_path)
    if not path.exists():
        return empty_store(repo=repo)
    raw = json.loads(path.read_text(encoding="utf-8"))
    return raw


def save_store(store_path: str | Path, store: dict[str, Any]) -> None:
    errors = validate_store_dict(store)
    if errors:
        raise ValueError("Refusing to write invalid automation store:\n- " + "\n- ".join(errors))
    path = Path(store_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = path.with_suffix(".json.tmp")
    tmp_path.write_text(json.dumps(store, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    tmp_path.replace(path)


def merge_run_into_store(
    store: dict[str, Any],
    run_dict: dict[str, Any],
    max_runs: int = 200,
) -> tuple[dict[str, Any], bool]:
    """Idempotently upsert a validated real run into the store.

    Returns (updated_store, changed_flag).
    """
    errors = validate_run_dict(run_dict)
    if errors:
        raise ValueError("Refusing to ingest invalid or non-real run:\n- " + "\n- ".join(errors))

    runs: list[dict[str, Any]] = list(store.get("runs", []))
    run_id = run_dict["id"]
    existing_idx = next((i for i, r in enumerate(runs) if r.get("id") == run_id), None)

    changed = True
    if existing_idx is not None:
        if runs[existing_idx] == run_dict:
            changed = False
        else:
            runs[existing_idx] = run_dict
    else:
        runs.append(run_dict)

    runs.sort(key=lambda r: (str(r.get("timestamp", "")), str(r.get("id", ""))), reverse=True)
    if max_runs > 0 and len(runs) > max_runs:
        runs = runs[:max_runs]

    now_iso = utc_now_iso()
    store["runs"] = runs
    store["updatedAt"] = now_iso

    ci_block = dict(store.get("ci") or {})
    run_ci = run_dict.get("ci") or {}
    ci_block["lastIngestAt"] = run_ci.get("ingestedAt") or now_iso
    ci_block["lastRunId"] = run_id
    if run_ci.get("jobUrl"):
        ci_block["lastJobUrl"] = run_ci.get("jobUrl")
    if run_ci.get("commitSha"):
        ci_block["lastCommitSha"] = run_ci.get("commitSha")
    ci_block["totalIngestedRuns"] = len(runs)
    store["ci"] = ci_block
    return store, changed
