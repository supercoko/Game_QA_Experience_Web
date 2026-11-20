#!/usr/bin/env python3
"""Zero-dependency CI ingestion & validation script for GitHub Actions and Jenkins.

Runs purely on Python standard library so CI runners (ubuntu-latest / Windows agents)
can validate, stamp CI provenance, deduplicate/merge real automation runs into
`web/data/automation-runs.json` in < 1 second without installing heavy packages.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent
SRC_DIR = SCRIPT_DIR.parent / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from qa_observer.reporting.store import load_store, merge_run_into_store, save_store  # noqa: E402
from qa_observer.schema import utc_now_iso, validate_run_dict, validate_store_dict  # noqa: E402


def detect_ci_provenance(trigger_override: str | None = None) -> dict[str, Any]:
    """Extract real CI environment provenance from GitHub Actions or Jenkins env vars."""
    now_iso = utc_now_iso()
    if os.environ.get("GITHUB_ACTIONS") == "true":
        server = os.environ.get("GITHUB_SERVER_URL", "https://github.com").rstrip("/")
        repo = os.environ.get("GITHUB_REPOSITORY", "")
        run_id = os.environ.get("GITHUB_RUN_ID")
        run_num_raw = os.environ.get("GITHUB_RUN_NUMBER")
        run_num = int(run_num_raw) if run_num_raw and run_num_raw.isdigit() else None
        job_url = f"{server}/{repo}/actions/runs/{run_id}" if repo and run_id else None
        return {
            "provider": "github-actions",
            "triggeredBy": trigger_override or os.environ.get("GITHUB_EVENT_NAME") or "github-actions",
            "workflow": os.environ.get("GITHUB_WORKFLOW") or "ingest-automation-run.yml",
            "jobRunId": run_id,
            "jobRunNumber": run_num,
            "jobUrl": job_url,
            "commitSha": (os.environ.get("GITHUB_SHA") or "")[:12] or None,
            "branch": os.environ.get("GITHUB_REF_NAME") or None,
            "runner": os.environ.get("RUNNER_NAME") or os.environ.get("RUNNER_OS") or "github-hosted",
            "ingestedAt": now_iso,
        }

    if os.environ.get("JENKINS_URL"):
        build_num_raw = os.environ.get("BUILD_NUMBER")
        build_num = int(build_num_raw) if build_num_raw and build_num_raw.isdigit() else None
        return {
            "provider": "jenkins",
            "triggeredBy": trigger_override or "jenkins",
            "workflow": os.environ.get("JOB_NAME") or "jenkins-pipeline",
            "jobRunId": os.environ.get("BUILD_ID"),
            "jobRunNumber": build_num,
            "jobUrl": os.environ.get("BUILD_URL"),
            "commitSha": (os.environ.get("GIT_COMMIT") or "")[:12] or None,
            "branch": os.environ.get("GIT_BRANCH") or None,
            "runner": os.environ.get("NODE_NAME") or "jenkins-agent",
            "ingestedAt": now_iso,
        }

    return {
        "provider": "local-cli",
        "triggeredBy": trigger_override or "local-ingest",
        "workflow": "ci_ingest.py",
        "jobRunId": None,
        "jobRunNumber": None,
        "jobUrl": None,
        "commitSha": None,
        "branch": None,
        "runner": os.environ.get("COMPUTERNAME") or os.environ.get("HOSTNAME") or "local",
        "ingestedAt": now_iso,
    }


def _stamp_ci(run_dict: dict[str, Any], ci_meta: dict[str, Any]) -> dict[str, Any]:
    merged_ci = dict(run_dict.get("ci") or {})
    # Preserve original runner host if payload came from Windows node into Ubuntu GitHub Action
    orig_runner = merged_ci.get("runner")
    merged_ci.update({k: v for k, v in ci_meta.items() if v is not None})
    if orig_runner and ci_meta.get("provider") == "github-actions" and orig_runner != ci_meta.get("runner"):
        merged_ci["runner"] = f"{orig_runner} -> {ci_meta.get('runner')}"
    run_dict["ci"] = merged_ci
    return run_dict


def _extract_runs_from_payload(raw_obj: Any) -> list[dict[str, Any]]:
    if isinstance(raw_obj, dict):
        if "run" in raw_obj and isinstance(raw_obj["run"], dict):
            return [raw_obj["run"]]
        if "runs" in raw_obj and isinstance(raw_obj["runs"], list):
            return [r for r in raw_obj["runs"] if isinstance(r, dict)]
        return [raw_obj]
    if isinstance(raw_obj, list):
        return [r for r in raw_obj if isinstance(r, dict)]
    raise ValueError("Unsupported JSON payload structure")


def _write_github_outputs(outputs: dict[str, str]) -> None:
    gh_out = os.environ.get("GITHUB_OUTPUT")
    if not gh_out:
        return
    with Path(gh_out).open("a", encoding="utf-8") as fh:
        for k, v in outputs.items():
            fh.write(f"{k}={v}\n")


def _write_github_summary(ingested: list[dict[str, Any]], store_path: Path, total_runs: int) -> None:
    summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
    if not summary_path:
        return
    lines = [
        "## 非侵入自动化真实数据 CI 入库摘要",
        "",
        f"- **数据文件**: `{store_path}`",
        f"- **本次入库条数**: `{len(ingested)}` | **当前累计真实巡检轮次**: `{total_runs}`",
        "",
        "| Run ID | 游戏 | 版本 | 模式 | 状态 | 通过率 | 异常数 |",
        "| --- | --- | --- | --- | --- | --- | ---: |",
    ]
    for r in ingested:
        pr = f"{r.get('passRate')}%" if r.get("passRate") is not None else "N/A"
        lines.append(
            f"| `{r.get('id')}` | {r.get('game')} | {r.get('version')} | `{r.get('mode')}` | "
            f"**{r.get('status')}** | {pr} | {len(r.get('findings', []))} |"
        )
    lines.append("")
    with Path(summary_path).open("a", encoding="utf-8") as fh:
        fh.write("\n".join(lines))


def cmd_validate(args: argparse.Namespace) -> int:
    store = load_store(args.store)
    errors = validate_store_dict(store)
    if errors:
        print(f"[FAIL] {args.store} 校验未通过：", file=sys.stderr)
        for err in errors:
            print(f"  - {err}", file=sys.stderr)
        return 1
    print(
        f"[OK] {args.store} 校验通过：schemaVersion={store.get('schemaVersion')}, "
        f"policy={store.get('policy')}, runs={len(store.get('runs', []))}"
    )
    return 0


def cmd_ingest(args: argparse.Namespace) -> int:
    store_path = Path(args.store)
    store = load_store(store_path)
    ci_meta = detect_ci_provenance(trigger_override=args.trigger)

    candidates: list[tuple[dict[str, Any], Path | None]] = []

    raw_payload_text = args.payload_json.strip()
    if not raw_payload_text and args.payload_env:
        raw_payload_text = os.environ.get(args.payload_env, "").strip()

    if raw_payload_text and raw_payload_text != "{}":
        parsed = json.loads(raw_payload_text)
        if parsed:
            for item in _extract_runs_from_payload(parsed):
                candidates.append((item, None))

    if args.payload_file:
        pf = Path(args.payload_file)
        parsed = json.loads(pf.read_text(encoding="utf-8"))
        for item in _extract_runs_from_payload(parsed):
            candidates.append((item, None))

    if args.inbox_dir:
        inbox = Path(args.inbox_dir)
        if inbox.exists():
            for jf in sorted(inbox.glob("*.json")):
                parsed = json.loads(jf.read_text(encoding="utf-8"))
                for item in _extract_runs_from_payload(parsed):
                    candidates.append((item, jf))

    if not candidates:
        print("[INFO] 未发现待入库的真实巡检报告载荷。")
        _write_github_outputs({"changed": "false", "ingested_count": "0"})
        return 0

    any_changed = False
    ingested_runs: list[dict[str, Any]] = []
    processed_inbox_files: set[Path] = set()

    for run_obj, src_file in candidates:
        stamped = _stamp_ci(run_obj, ci_meta)
        errs = validate_run_dict(stamped)
        if errs:
            print(f"[REJECT] 拒绝入库非法/编造载荷 ({src_file or 'payload'}):", file=sys.stderr)
            for e in errs:
                print(f"  - {e}", file=sys.stderr)
            return 1
        store, changed = merge_run_into_store(store, stamped, max_runs=args.max_runs)
        if changed:
            any_changed = True
        ingested_runs.append(stamped)
        if src_file is not None:
            processed_inbox_files.add(src_file)

    if any_changed:
        save_store(store_path, store)
        print(f"[OK] 成功入库 {len(ingested_runs)} 条真实记录 -> {store_path}（累计 {len(store['runs'])} 条）")
    else:
        print(f"[OK] {len(ingested_runs)} 条记录已存在且无变更（幂等跳过写入）。")

    if args.clean_inbox:
        for src_file in processed_inbox_files:
            try:
                src_file.unlink()
                print(f"[CLEAN] 已归档移除 inbox 文件：{src_file}")
            except OSError:
                pass

    last_id = ingested_runs[-1]["id"] if ingested_runs else ""
    last_status = ingested_runs[-1]["status"] if ingested_runs else ""
    _write_github_outputs(
        {
            "changed": "true" if (any_changed or bool(processed_inbox_files and args.clean_inbox)) else "false",
            "ingested_count": str(len(ingested_runs)),
            "last_run_id": last_id,
            "last_status": last_status,
        }
    )
    _write_github_summary(ingested_runs, store_path, len(store.get("runs", [])))
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="CI Automation Run Validator & Ingester (Real Data Only)")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_val = sub.add_parser("validate", help="Validate automation-runs.json schema and real-data policy")
    p_val.add_argument("--store", default="web/data/automation-runs.json")

    p_ing = sub.add_parser("ingest", help="Validate, stamp CI provenance, and upsert real run payloads")
    p_ing.add_argument("--store", default="web/data/automation-runs.json")
    p_ing.add_argument("--payload-json", default="")
    p_ing.add_argument("--payload-env", default="")
    p_ing.add_argument("--payload-file", default="")
    p_ing.add_argument("--inbox-dir", default="")
    p_ing.add_argument("--trigger", default=None)
    p_ing.add_argument("--max-runs", type=int, default=200)
    p_ing.add_argument("--clean-inbox", action="store_true")
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if args.cmd == "validate":
        return cmd_validate(args)
    if args.cmd == "ingest":
        return cmd_ingest(args)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
