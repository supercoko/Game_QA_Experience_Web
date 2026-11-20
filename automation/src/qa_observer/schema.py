"""Strict Schema v2 models and validation for non-invasive automation runs.

Every metric field is explicitly nullable so unmeasured sensors remain `None`
instead of being replaced with fabricated values.
"""

from __future__ import annotations

import datetime as dt
import uuid
from dataclasses import asdict, dataclass, field
from typing import Any

SCHEMA_VERSION = "2.0"

ALLOWED_RUN_STATUS = {"PASS", "WARN", "FAIL"}
ALLOWED_CASE_STATUS = {"PASS", "WARN", "FAIL", "SKIP"}
ALLOWED_SEVERITIES = {"P0", "P1", "P2", "P3"}
ALLOWED_MODES = {"observe", "active-ui", "replay"}
ALLOWED_ORIGINS = {"real_capture", "real_replay"}
FORBIDDEN_ORIGINS = {"mock", "demo", "fake", "synthetic", "simulated", "sample", "fabricated"}


def utc_now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def local_now_iso() -> str:
    return dt.datetime.now().astimezone().replace(microsecond=0).isoformat()


def generate_run_id(game_key: str) -> str:
    prefix_map = {
        "genshin": "YS",
        "starrail": "SR",
        "zzz": "ZZZ",
        "endfield": "ZMD",
    }
    prefix = prefix_map.get(game_key.lower(), game_key.upper()[:4])
    stamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    suffix = uuid.uuid4().hex[:4]
    return f"RUN-{prefix}-{stamp}-{suffix}"


@dataclass
class Finding:
    caseId: str
    severity: str
    rule: str
    msg: str
    timestamp: str | None = None
    evidencePath: str | None = None
    details: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class CaseResult:
    caseId: str
    name: str
    status: str  # PASS | WARN | FAIL | SKIP
    durationSec: float = 0.0
    detail: str = ""
    metrics: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        data = asdict(self)
        data["durationSec"] = round(float(self.durationSec), 2)
        return data


@dataclass
class PerformanceMetrics:
    coldStartSec: float | None = None
    avgFps: float | None = None
    low1Fps: float | None = None
    low01Fps: float | None = None
    p50FrameTimeMs: float | None = None
    p95FrameTimeMs: float | None = None
    p99FrameTimeMs: float | None = None
    maxFrameTimeMs: float | None = None
    hitchCount50ms: int | None = None
    hitchCount100ms: int | None = None
    memMbAvg: float | None = None
    memMbPeak: float | None = None
    memLeakSlopeMbPerMin: float | None = None
    cpuPctAvg: float | None = None
    framesAnalyzed: int = 0
    teleportLoadsSec: list[float] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        out: dict[str, Any] = {}
        for k, v in asdict(self).items():
            if isinstance(v, float):
                out[k] = round(v, 2)
            elif isinstance(v, list):
                out[k] = [round(x, 2) if isinstance(x, float) else x for x in v]
            else:
                out[k] = v
        return out


@dataclass
class EnvironmentInfo:
    os: str = ""
    resolution: str | None = None
    processName: str | None = None
    captureBackend: str | None = None
    presentmonAttached: bool = False
    ocrEngine: str | None = None
    vlmEnabled: bool = False
    isAdmin: bool | None = None
    host: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class CIMetadata:
    provider: str = "local-cli"  # github-actions | jenkins | local-cli
    triggeredBy: str = "manual"  # repository_dispatch | workflow_dispatch | push-inbox | jenkins | manual
    workflow: str | None = None
    jobRunId: str | None = None
    jobRunNumber: int | None = None
    jobUrl: str | None = None
    commitSha: str | None = None
    branch: str | None = None
    runner: str | None = None
    ingestedAt: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class ArtifactRef:
    kind: str  # screenshot | telemetry | summary | presentmon_csv
    path: str
    label: str = ""

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class RunReport:
    id: str
    game: str
    gameKey: str
    version: str
    suite: str
    mode: str  # observe | active-ui | replay
    dataOrigin: str = "real_capture"  # real_capture | real_replay
    schemaVersion: str = SCHEMA_VERSION
    timestamp: str = field(default_factory=local_now_iso)
    date: str = ""
    status: str = "PASS"
    passRate: float | None = None
    totalCases: int = 0
    passedCases: int = 0
    warnedCases: int = 0
    failedCases: int = 0
    skippedCases: int = 0
    durationSec: float = 0.0
    metrics: PerformanceMetrics = field(default_factory=PerformanceMetrics)
    environment: EnvironmentInfo = field(default_factory=EnvironmentInfo)
    ci: CIMetadata = field(default_factory=CIMetadata)
    cases: list[CaseResult] = field(default_factory=list)
    findings: list[Finding] = field(default_factory=list)
    artifacts: list[ArtifactRef] = field(default_factory=list)
    notes: str = ""

    def finalize(self) -> "RunReport":
        if not self.date:
            self.date = self.timestamp[:10]
        self.totalCases = len(self.cases)
        self.passedCases = sum(1 for c in self.cases if c.status == "PASS")
        self.warnedCases = sum(1 for c in self.cases if c.status == "WARN")
        self.failedCases = sum(1 for c in self.cases if c.status == "FAIL")
        self.skippedCases = sum(1 for c in self.cases if c.status == "SKIP")
        executed = self.totalCases - self.skippedCases
        if executed > 0:
            self.passRate = round((self.passedCases / executed) * 100.0, 1)
        else:
            self.passRate = None

        has_p0_p1 = any(f.severity in {"P0", "P1"} for f in self.findings)
        if self.failedCases > 0 or has_p0_p1:
            self.status = "FAIL"
        elif self.warnedCases > 0 or len(self.findings) > 0:
            self.status = "WARN"
        else:
            self.status = "PASS"
        self.durationSec = round(float(self.durationSec), 2)
        return self

    def to_dict(self) -> dict[str, Any]:
        self.finalize()
        return {
            "id": self.id,
            "schemaVersion": self.schemaVersion,
            "dataOrigin": self.dataOrigin,
            "timestamp": self.timestamp,
            "date": self.date,
            "game": self.game,
            "gameKey": self.gameKey,
            "version": self.version,
            "suite": self.suite,
            "mode": self.mode,
            "status": self.status,
            "passRate": self.passRate,
            "totalCases": self.totalCases,
            "passedCases": self.passedCases,
            "warnedCases": self.warnedCases,
            "failedCases": self.failedCases,
            "skippedCases": self.skippedCases,
            "durationSec": self.durationSec,
            "metrics": self.metrics.to_dict(),
            "environment": self.environment.to_dict(),
            "ci": self.ci.to_dict(),
            "cases": [c.to_dict() for c in self.cases],
            "findings": [f.to_dict() for f in self.findings],
            "artifacts": [a.to_dict() for a in self.artifacts],
            "notes": self.notes,
        }


def empty_store(repo: str = "supercoko/Game_QA_Experience_Web") -> dict[str, Any]:
    return {
        "schemaVersion": SCHEMA_VERSION,
        "updatedAt": None,
        "repository": repo,
        "policy": "real-data-only",
        "note": "仅收录由非侵入自动化工具实际执行或 CI 流水线校验入库的真实巡检数据；不预置任何编造或模拟记录。",
        "ci": {
            "pipeline": "github-actions",
            "ingestWorkflow": ".github/workflows/ingest-automation-run.yml",
            "qualityGateWorkflow": ".github/workflows/ci-quality-gate.yml",
            "deployWorkflow": ".github/workflows/deploy-pages.yml",
            "lastIngestAt": None,
            "lastRunId": None,
            "lastJobUrl": None,
            "lastCommitSha": None,
            "totalIngestedRuns": 0,
        },
        "runs": [],
    }


def validate_run_dict(run: Any) -> list[str]:
    """Validate a single run report dict against Schema v2 and anti-mock policy."""
    errors: list[str] = []
    if not isinstance(run, dict):
        return ["Run payload must be a JSON object"]

    required_str = ["id", "game", "gameKey", "version", "suite", "mode", "timestamp", "date", "status", "dataOrigin"]
    for key in required_str:
        val = run.get(key)
        if not isinstance(val, str) or not val.strip():
            errors.append(f"Missing or empty string field: '{key}'")

    origin = str(run.get("dataOrigin", "")).strip().lower()
    if origin in FORBIDDEN_ORIGINS or origin not in ALLOWED_ORIGINS:
        errors.append(
            f"Invalid dataOrigin '{run.get('dataOrigin')}': only {sorted(ALLOWED_ORIGINS)} are accepted (mock/fabricated data is rejected)"
        )

    if run.get("status") not in ALLOWED_RUN_STATUS:
        errors.append(f"Invalid status '{run.get('status')}': expected one of {sorted(ALLOWED_RUN_STATUS)}")

    if run.get("mode") not in ALLOWED_MODES:
        errors.append(f"Invalid mode '{run.get('mode')}': expected one of {sorted(ALLOWED_MODES)}")

    pass_rate = run.get("passRate")
    if pass_rate is not None:
        if not isinstance(pass_rate, (int, float)) or not (0.0 <= float(pass_rate) <= 100.0):
            errors.append(f"passRate must be null or between 0 and 100, got {pass_rate!r}")

    for count_field in ("totalCases", "passedCases", "failedCases"):
        val = run.get(count_field)
        if not isinstance(val, int) or val < 0:
            errors.append(f"{count_field} must be a non-negative integer, got {val!r}")

    metrics = run.get("metrics")
    if not isinstance(metrics, dict):
        errors.append("Missing object field: 'metrics'")
    else:
        for non_neg in ("coldStartSec", "avgFps", "low1Fps", "low01Fps", "memMbAvg", "memMbPeak"):
            v = metrics.get(non_neg)
            if v is not None and (not isinstance(v, (int, float)) or float(v) < 0):
                errors.append(f"metrics.{non_neg} must be null or >= 0, got {v!r}")

    ci_meta = run.get("ci")
    if not isinstance(ci_meta, dict) or not ci_meta.get("provider"):
        errors.append("Missing object field 'ci' with non-empty 'provider'")

    cases = run.get("cases")
    if not isinstance(cases, list):
        errors.append("Field 'cases' must be an array")
    else:
        for idx, c in enumerate(cases):
            if not isinstance(c, dict):
                errors.append(f"cases[{idx}] must be an object")
                continue
            if not c.get("caseId") or not c.get("name"):
                errors.append(f"cases[{idx}] requires 'caseId' and 'name'")
            if c.get("status") not in ALLOWED_CASE_STATUS:
                errors.append(f"cases[{idx}].status invalid: {c.get('status')!r}")

    findings = run.get("findings")
    if not isinstance(findings, list):
        errors.append("Field 'findings' must be an array")
    else:
        for idx, f in enumerate(findings):
            if not isinstance(f, dict):
                errors.append(f"findings[{idx}] must be an object")
                continue
            for fk in ("caseId", "severity", "rule", "msg"):
                if not f.get(fk):
                    errors.append(f"findings[{idx}] missing '{fk}'")
            if f.get("severity") not in ALLOWED_SEVERITIES:
                errors.append(f"findings[{idx}].severity invalid: {f.get('severity')!r}")

    return errors


def validate_store_dict(store: Any) -> list[str]:
    """Validate the full web/data/automation-runs.json document."""
    errors: list[str] = []
    if not isinstance(store, dict):
        return ["Store document must be a JSON object"]

    if store.get("schemaVersion") != SCHEMA_VERSION:
        errors.append(f"Expected schemaVersion '{SCHEMA_VERSION}', got {store.get('schemaVersion')!r}")

    if store.get("policy") != "real-data-only":
        errors.append("Store policy must be 'real-data-only'")

    ci_block = store.get("ci")
    if not isinstance(ci_block, dict):
        errors.append("Missing top-level 'ci' metadata object")

    runs = store.get("runs")
    if not isinstance(runs, list):
        errors.append("Top-level 'runs' must be an array")
        return errors

    seen_ids: set[str] = set()
    for idx, run in enumerate(runs):
        run_errors = validate_run_dict(run)
        for err in run_errors:
            errors.append(f"runs[{idx}]: {err}")
        rid = run.get("id") if isinstance(run, dict) else None
        if rid:
            if rid in seen_ids:
                errors.append(f"Duplicate run id detected: '{rid}'")
            seen_ids.add(rid)

    return errors
