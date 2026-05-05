"""Seed taxid_dict from a curated CSV (hash,category,channel,notes).

This seeds the lookup dictionary that the front-end uses to enrich invoices
with category/channel without exposing raw tax IDs.
」」」
Usage: python scripts/seed_taxid_dict.py data/taxid_dict.csv
"""
from __future__ import annotations

import csv
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
    if len(sys.argv) < 2:
        print("Usage: python scripts/seed_taxid_dict.py <csv_path>", file=sys.stderr)
        return 2
    csv_path = Path(sys.argv[1])
    if not csv_path.exists():
        print(f"File not found: {csv_path}", file=sys.stderr)
        return 2
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("Missing SUPABASE env vars", file=sys.stderr)
        return 2
    rows: list[dict] = []
    with csv_path.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            rows.append({
                "hash": r["hash"],
                "category": r["category"],
                "channel": r.get("channel") or None,
                "notes": r.get("notes") or None,
            })
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }
    endpoint = f"{url}/rest/v1/taxid_dict"
    chunk = 500
    for i in range(0, len(rows), chunk):
        batch = rows[i : i + chunk]
        resp = requests.post(endpoint, headers=headers, data=json.dumps(batch), timeout=60)
        if resp.status_code >= 300:
            print(f"Batch {i}: failed {resp.status_code} {resp.text}", file=sys.stderr)
            return 1
    print(f"Seeded {len(rows)} dictionary rows.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
