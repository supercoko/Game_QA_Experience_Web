"""Generate browser configuration from GitHub Actions repository variables."""

import json
import os
import re
import sys
from pathlib import Path


url = os.environ.get("SUPABASE_URL", "").strip().rstrip("/")
key = os.environ.get("SUPABASE_PUBLISHABLE_KEY", "").strip()

if url or key:
    if not re.fullmatch(r"https://[a-z0-9]+\.supabase\.co", url):
        sys.exit("SUPABASE_URL must be the HTTPS Supabase project URL")
    if not re.fullmatch(r"sb_publishable_[a-zA-Z0-9_-]+", key):
        sys.exit("SUPABASE_PUBLISHABLE_KEY must be a browser publishable key")

config = json.dumps({"url": url, "key": key})
Path(sys.argv[1]).write_text(f"window.QA_SUPABASE_CONFIG = {config};\n", encoding="utf-8")
