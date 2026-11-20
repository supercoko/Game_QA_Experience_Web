"""CI publisher supporting GitHub repository_dispatch, inbox drop-in, and Feishu/generic webhooks."""

from __future__ import annotations

import copy
import json
import os
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

from qa_observer.schema import validate_run_dict

GITHUB_DISPATCH_MAX_BYTES = 58_000  # Keep safely under GitHub's 65KB client_payload limit


def compact_report_for_dispatch(report: dict[str, Any]) -> dict[str, Any]:
    """Ensure the JSON payload fits safely inside GitHub repository_dispatch limits."""
    copy_rep = copy.deepcopy(report)
    raw = json.dumps(copy_rep, ensure_ascii=False).encode("utf-8")
    if len(raw) <= GITHUB_DISPATCH_MAX_BYTES:
        return copy_rep

    # Trim verbose details while preserving all core metrics, cases, and findings
    for case in copy_rep.get("cases", []):
        if isinstance(case.get("metrics"), dict) and len(json.dumps(case["metrics"])) > 500:
            case["metrics"] = {"truncated": True}
    for f in copy_rep.get("findings", []):
        if isinstance(f.get("details"), dict):
            f["details"] = {}
    return copy_rep


def push_github_dispatch(
    report: dict[str, Any],
    repo: str,
    token: str | None = None,
    event_type: str = "automation-run-report",
    submitted_by: str | None = None,
    timeout_sec: float = 20.0,
) -> dict[str, Any]:
    """Push a real validated run report to GitHub Actions via repository_dispatch API."""
    errors = validate_run_dict(report)
    if errors:
        raise ValueError("Cannot push invalid run report to CI:\n- " + "\n- ".join(errors))

    auth_token = token or os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if not auth_token:
        raise RuntimeError(
            "缺少 GitHub Token：请设置环境变量 GITHUB_TOKEN（需要对应仓库 Contents: Write 权限），或通过 --token 传入。"
        )
    if "/" not in repo:
        raise ValueError(f"Invalid GitHub repo format '{repo}', expected 'owner/repo'")

    compact = compact_report_for_dispatch(report)
    payload = {
        "event_type": event_type,
        "client_payload": {
            "run": compact,
            "submitted_by": submitted_by or os.environ.get("USERNAME") or os.environ.get("USER") or "qa-observer-cli",
        },
    }
    url = f"https://api.github.com/repos/{repo}/dispatches"
    req = urllib.request.Request(
        url=url,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {auth_token}",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
            "User-Agent": "qa-observer-cli/0.1",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout_sec) as resp:
            return {
                "ok": resp.status in {200, 201, 204},
                "status_code": resp.status,
                "repo": repo,
                "event_type": event_type,
                "run_id": report["id"],
                "actions_url": f"https://github.com/{repo}/actions/workflows/ingest-automation-run.yml",
            }
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"GitHub dispatch HTTP {exc.code}: {body}") from exc


def save_to_inbox(report: dict[str, Any], inbox_dir: str | Path) -> Path:
    """Write validated single run report to automation/reports/inbox/<run_id>.json for git-push CI ingest."""
    errors = validate_run_dict(report)
    if errors:
        raise ValueError("Cannot save invalid run to CI inbox:\n- " + "\n- ".join(errors))
    folder = Path(inbox_dir)
    folder.mkdir(parents=True, exist_ok=True)
    target = folder / f"{report['id']}.json"
    target.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return target


def send_webhook_notification(
    report: dict[str, Any],
    webhook_url: str,
    provider: str = "feishu",
    timeout_sec: float = 15.0,
) -> dict[str, Any]:
    """Send structured alert summary to Feishu (飞书机器人) or generic JSON webhook."""
    m = report.get("metrics", {})
    findings = report.get("findings", [])
    summary_lines = [
        f"游戏：{report.get('game')} ({report.get('version')})",
        f"Run ID：{report.get('id')} | 模式：{report.get('mode')}",
        f"结果：{report.get('status')} | 通过率：{report.get('passRate')}% ({report.get('passedCases')}/{report.get('totalCases')})",
        f"性能：Avg FPS={m.get('avgFps')}, 1% Low={m.get('low1Fps')}, Mem Peak={m.get('memMbPeak')}MB",
        f"检出异常：{len(findings)} 条",
    ]
    for f in findings[:5]:
        summary_lines.append(f"- [{f.get('severity')}] {f.get('rule')}: {f.get('msg')}")

    if provider.lower() == "feishu":
        color = "green" if report.get("status") == "PASS" else ("orange" if report.get("status") == "WARN" else "red")
        body: dict[str, Any] = {
            "msg_type": "interactive",
            "card": {
                "header": {
                    "title": {"tag": "plain_text", "content": f"[{report.get('status')}] {report.get('game')} 非侵入巡检报告"},
                    "template": color,
                },
                "elements": [
                    {"tag": "markdown", "content": "\n".join(summary_lines)},
                ],
            },
        }
    else:
        body = {"event": "qa_observer_report", "summary": "\n".join(summary_lines), "report": report}

    req = urllib.request.Request(
        url=webhook_url,
        data=json.dumps(body, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout_sec) as resp:
        return {"ok": 200 <= resp.status < 300, "status_code": resp.status}
