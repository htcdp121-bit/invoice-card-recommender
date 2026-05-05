"""Update card rules in Supabase.

This script reads card rule JSON from data/card_rules.json (if present),
and upserts each entry into the Supabase 'card_rules' table using the
service role key.

Environment variables required:
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
」」」
This script is intended to be run from GitHub Actions. It does not scrape
any external sites; rule data should be curated and committed to the repo.
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

try:
    import requests
except ImportError:
    print("Please install requests: pip install requests", file=sys.stderr)
    raise


def main() -> int:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY", file=sys.stderr)
        return 2
    data_path = Path("data/card_rules.json")
    if not data_path.exists():
        print(f"No data file at {data_path}, nothing to update.")
        return 0
    rules = json.loads(data_path.read_text(encoding="utf-8"))
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }
    endpoint = f"{url}/rest/v1/card_rules"
    resp = requests.post(endpoint, headers=headers, data=json.dumps(rules), timeout=30)
    if resp.status_code >= 300:
        print(f"Upsert failed: {resp.status_code} {resp.text}", file=sys.stderr)
        return 1
    print(f"Upserted {len(rules)} card rules.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
