#!/usr/bin/env python3
"""Fix raw address venue names in the merged Shameless Google Sheet."""

import subprocess
import json

SHEET_ID = "1XgN6Sgwt4t6jJiCTDZZPb-5gxiYdyGMrWbCa71NqJLk"
TAB = "Shameless past parties - MERGED"

# Monkey Loft rows (# column value)
MONKEY_LOFT_ROWS = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,19,20,21,22,24,25,26,27,28,29,30]
# Pony rows
PONY_ROWS = [67, 72]

data_ranges = []

for num in MONKEY_LOFT_ROWS:
    sheet_row = num + 1
    data_ranges.append({
        "range": f"'{TAB}'!D{sheet_row}",
        "values": [["Monkey Loft, Seattle"]]
    })

for num in PONY_ROWS:
    sheet_row = num + 1
    data_ranges.append({
        "range": f"'{TAB}'!D{sheet_row}",
        "values": [["Pony, Seattle"]]
    })

print(f"Preparing {len(data_ranges)} venue fixes ({len(MONKEY_LOFT_ROWS)} Monkey Loft, {len(PONY_ROWS)} Pony)...")

params = json.dumps({"spreadsheetId": SHEET_ID})
body = json.dumps({"valueInputOption": "RAW", "data": data_ranges})

cmd = ["gws", "sheets", "spreadsheets", "values", "batchUpdate", "--params", params, "--json", body]
result = subprocess.run(cmd, capture_output=True, text=True)
lines = [l for l in result.stdout.splitlines() if "keyring" not in l.lower()]

try:
    response = json.loads("\n".join(lines))
    if "error" in response:
        print(f"ERROR: {response['error']}")
    else:
        print(f"Success! Updated {response.get('totalUpdatedRows', '?')} rows ({response.get('totalUpdatedCells', '?')} cells)")
except json.JSONDecodeError as e:
    print(f"Parse error: {e}")
    print("\n".join(lines)[:300])
