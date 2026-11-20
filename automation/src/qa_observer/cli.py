"""CLI entrypoint for `qa-observer` (Genshin Impact implemented + extensible 4-game hub)."""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any

from qa_observer.config import REPO_ROOT, default_game_config_path, load_config
from qa_observer.games.base import GAME_REGISTRY
from qa_observer.games.genshin import GenshinAdapter
from qa_observer.reporting.ci_publisher import (
    push_github_dispatch,
    save_to_inbox,
    send_webhook_notification,
)
from qa_observer.reporting.store import load_store, merge_run_into_store, save_store
from qa_observer.schema import validate_store_dict


def _post_run_actions(report_dict: dict[str, Any], args: argparse.Namespace, cfg: dict[str, Any]) -> None:
    ci_cfg = cfg.get("ci", {})
    if getattr(args, "save_store", None):
        store_path = Path(args.save_store)
        store = load_store(store_path)
        store, _ = merge_run_into_store(store, report_dict)
        save_store(store_path, store)
        print(f"[store] 已合并写入真实巡检记录到：{store_path}")

    if getattr(args, "save_inbox", False):
        inbox_dir = REPO_ROOT / ci_cfg.get("inbox_dir", "automation/reports/inbox")
        inbox_file = save_to_inbox(report_dict, inbox_dir)
        print(f"[ci-inbox] 已写入 CI 收件箱：{inbox_file}（git push 后自动触发入库与 Pages 发布）")

    if getattr(args, "ci_push", False):
        repo = getattr(args, "ci_repo", None) or ci_cfg.get("repo", "supercoko/Game_QA_Experience_Web")
        token = os.environ.get(getattr(args, "token_env", "GITHUB_TOKEN"))
        res = push_github_dispatch(
            report=report_dict,
            repo=repo,
            token=token,
            event_type=ci_cfg.get("event_type", "automation-run-report"),
        )
        print(f"[ci-push] 已触发 GitHub Actions CI 入库：HTTP {res['status_code']} -> {res['actions_url']}")

    webhook = getattr(args, "webhook_url", None) or os.environ.get("QA_WEBHOOK_URL")
    if webhook:
        provider = getattr(args, "webhook_provider", "feishu")
        wres = send_webhook_notification(report_dict, webhook, provider=provider)
        print(f"[webhook] 通知已发送 ({provider})：HTTP {wres['status_code']}")


def _print_report_brief(report_dict: dict[str, Any]) -> None:
    m = report_dict.get("metrics", {})
    print("=" * 68)
    print(f"Run ID : {report_dict['id']}")
    print(f"游戏   : {report_dict['game']} ({report_dict['version']}) | 模式: {report_dict['mode']}")
    print(
        f"状态   : {report_dict['status']} | 通过率: {report_dict['passRate']}% "
        f"(PASS={report_dict['passedCases']}, WARN={report_dict.get('warnedCases', 0)}, "
        f"FAIL={report_dict['failedCases']}, SKIP={report_dict.get('skippedCases', 0)})"
    )
    print(
        f"性能   : ColdStart={m.get('coldStartSec')}s | AvgFPS={m.get('avgFps')} | "
        f"1%Low={m.get('low1Fps')} | P99={m.get('p99FrameTimeMs')}ms | MemPeak={m.get('memMbPeak')}MB"
    )
    print(f"帧数   : {m.get('framesAnalyzed')} 帧 | 异常数: {len(report_dict.get('findings', []))}")
    print("=" * 68)
    for case in report_dict.get("cases", []):
        print(f"  [{case['status']:4s}] {case['caseId']} · {case['name']} — {case['detail']}")
    if report_dict.get("findings"):
        print("\n检出异常：")
        for f in report_dict["findings"]:
            print(f"  * [{f['severity']}][{f['rule']}] {f['msg']}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="qa-observer",
        description="四款线上游戏非侵入式黑盒 QA 观测与 CI 上报工具（优先完整实现原神）",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # --- games list ---
    p_games = sub.add_parser("games", help="查看四款游戏适配器实现状态")
    p_games_sub = p_games.add_subparsers(dest="games_cmd", required=True)
    p_games_sub.add_parser("list", help="列出四款游戏实现状态")

    # --- genshin ---
    p_ys = sub.add_parser("genshin", help="原神（PC 线上客户端）非侵入自动化工具")
    ys_sub = p_ys.add_subparsers(dest="ys_cmd", required=True)

    def add_common_output_flags(p: argparse.ArgumentParser) -> None:
        p.add_argument("--config", default=str(default_game_config_path("genshin")), help="YAML/JSON 配置文件路径")
        p.add_argument("--reports-dir", default=None, help="单轮报告与证据输出目录（默认 automation/reports/runs）")
        p.add_argument("--save-store", default=None, help="可选：合并写入指定 JSON 看板文件（如 web/data/automation-runs.json）")
        p.add_argument("--save-inbox", action="store_true", help="可选：写入 automation/reports/inbox/ 供 git push 触发 CI 自动入库")
        p.add_argument("--ci-push", action="store_true", help="可选：直接通过 GitHub repository_dispatch 推送到 CI 自动校验入库")
        p.add_argument("--ci-repo", default=None, help="GitHub 仓库（owner/repo），默认读取配置文件")
        p.add_argument("--token-env", default="GITHUB_TOKEN", help="GitHub Token 环境变量名（默认 GITHUB_TOKEN）")
        p.add_argument("--webhook-url", default=None, help="可选：飞书/通用 Webhook 通知地址")
        p.add_argument("--webhook-provider", default="feishu", choices=["feishu", "generic"], help="Webhook 类型")
        p.add_argument("--vlm", action="store_true", help="启用可选 VLM 语义视觉抽检（需配置 VLM_API_KEY/OPENAI_API_KEY）")

    # genshin doctor
    p_doc = ys_sub.add_parser("doctor", help="环境体检：检查依赖、权限、PresentMon、模板与原神窗口")
    p_doc.add_argument("--config", default=str(default_game_config_path("genshin")))
    p_doc.add_argument("--game-dir", default=None, help="原神安装目录（只读 config.ini 获取真实版本号）")
    p_doc.add_argument("--presentmon", default=None, help="PresentMon.exe 路径")

    # genshin observe
    p_obs = ys_sub.add_parser("observe", help="【默认推荐】100% 零输入纯被动外部观测模式")
    add_common_output_flags(p_obs)
    p_obs.add_argument("--duration", type=float, default=60.0, help="观测持续秒数（默认 60s）")
    p_obs.add_argument("--wait-launch", action="store_true", help="等待游戏启动并统计冷启动耗时")
    p_obs.add_argument("--launch-timeout", type=float, default=120.0, help="等待启动超时秒数")
    p_obs.add_argument("--game-dir", default=None, help="原神安装目录（用于读取真实版本号）")
    p_obs.add_argument("--version", default=None, help="手动指定真实版本号（不指定时从 config.ini 读取或记为 unknown）")
    p_obs.add_argument("--presentmon", default=None, help="PresentMon.exe 路径（不指定时自动查找）")

    # genshin active-ui
    p_ui = ys_sub.add_parser("active-ui", help="【安全区可选】公共非对抗界面遍历巡检（ESC/B/C/F1/M）")
    add_common_output_flags(p_ui)
    p_ui.add_argument("--confirm-safe-zone", action="store_true", help="确认角色位于安全区且游戏前台，允许发送公共 UI 键")
    p_ui.add_argument("--dry-run", action="store_true", help="干跑模式：不发送真实按键，仅演练流程")
    p_ui.add_argument("--game-dir", default=None)
    p_ui.add_argument("--version", default=None)
    p_ui.add_argument("--presentmon", default=None)

    # genshin replay
    p_rep = ys_sub.add_parser("replay", help="离线回放模式：对真实录屏(MP4/MKV)或截图目录 + 可选 PresentMon CSV 运行完整分析")
    add_common_output_flags(p_rep)
    p_rep.add_argument("--input", required=True, help="真实视频文件或截图目录路径")
    p_rep.add_argument("--presentmon-csv", default=None, help="可选：同期录制的 PresentMon CSV 文件路径")
    p_rep.add_argument("--version", default="unknown", help="该录制对应的真实游戏版本号")
    p_rep.add_argument("--sample-fps", type=float, default=None, help="视频抽帧频率（默认使用配置文件）")

    # genshin capture-template
    p_tpl = ys_sub.add_parser("capture-template", help="从实时原神窗口裁剪保存键鼠/手柄图标模板")
    p_tpl.add_argument("--config", default=str(default_game_config_path("genshin")))
    p_tpl.add_argument("--name", required=True, help="模板文件名（如 kbm_prompt 或 pad_xbox_prompt）")
    p_tpl.add_argument("--roi", default="bottom_prompts", help="配置文件中的 ROI 名称（默认 bottom_prompts）")

    # --- ci ---
    p_ci = sub.add_parser("ci", help="CI 数据校验与远程上报命令")
    ci_sub = p_ci.add_subparsers(dest="ci_cmd", required=True)

    p_ci_push = ci_sub.add_parser("push", help="将本地生成的真实 report.json 推送至 GitHub Actions CI 入库")
    p_ci_push.add_argument("--report", required=True, help="单次巡检生成的 report.json 路径")
    p_ci_push.add_argument("--repo", default="supercoko/Game_QA_Experience_Web", help="目标 GitHub 仓库 owner/repo")
    p_ci_push.add_argument("--event-type", default="automation-run-report")
    p_ci_push.add_argument("--token-env", default="GITHUB_TOKEN")

    p_ci_val = ci_sub.add_parser("validate", help="校验 web/data/automation-runs.json 是否符合 Schema v2 且无编造数据")
    p_ci_val.add_argument("--store", default=str(REPO_ROOT / "web" / "data" / "automation-runs.json"))

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.command == "games" and args.games_cmd == "list":
        print(json.dumps(GAME_REGISTRY, ensure_ascii=False, indent=2))
        return 0

    if args.command == "ci":
        if args.ci_cmd == "validate":
            store = load_store(args.store)
            errors = validate_store_dict(store)
            if errors:
                print("校验失败：", file=sys.stderr)
                for err in errors:
                    print(f"  - {err}", file=sys.stderr)
                return 1
            print(f"校验通过：{args.store}（共 {len(store.get('runs', []))} 条真实记录，schemaVersion={store.get('schemaVersion')}）")
            return 0

        if args.ci_cmd == "push":
            report_dict = json.loads(Path(args.report).read_text(encoding="utf-8"))
            token = os.environ.get(args.token_env)
            res = push_github_dispatch(report_dict, repo=args.repo, token=token, event_type=args.event_type)
            print(json.dumps(res, ensure_ascii=False, indent=2))
            return 0

    if args.command == "genshin":
        cfg = load_config(args.config)
        adapter = GenshinAdapter(cfg)

        if args.ys_cmd == "doctor":
            info = adapter.doctor(game_dir=args.game_dir, presentmon_path=args.presentmon)
            print(json.dumps(info, ensure_ascii=False, indent=2))
            return 0

        if args.ys_cmd == "capture-template":
            out = adapter.capture_template(name=args.name, roi_name=args.roi)
            print(f"已保存真实模板：{out}")
            return 0

        if args.ys_cmd == "observe":
            report = adapter.run_observe(
                duration_sec=args.duration,
                wait_launch=args.wait_launch,
                launch_timeout_sec=args.launch_timeout,
                game_dir=args.game_dir,
                version_override=args.version,
                presentmon_path=args.presentmon,
                enable_vlm=args.vlm,
                reports_dir=args.reports_dir,
            )
        elif args.ys_cmd == "active-ui":
            report = adapter.run_active_ui(
                confirm_safe_zone=args.confirm_safe_zone,
                dry_run=args.dry_run,
                game_dir=args.game_dir,
                version_override=args.version,
                presentmon_path=args.presentmon,
                enable_vlm=args.vlm,
                reports_dir=args.reports_dir,
            )
        elif args.ys_cmd == "replay":
            report = adapter.run_replay(
                input_path=args.input,
                presentmon_csv=args.presentmon_csv,
                version=args.version,
                sample_fps=args.sample_fps,
                enable_vlm=args.vlm,
                reports_dir=args.reports_dir,
            )
        else:
            parser.error(f"Unknown genshin subcommand: {args.ys_cmd}")
            return 2

        report_dict = report.to_dict()
        _print_report_brief(report_dict)
        _post_run_actions(report_dict, args, cfg)
        return 0 if report_dict["status"] != "FAIL" else 2

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
