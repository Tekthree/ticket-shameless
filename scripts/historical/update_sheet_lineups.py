#!/usr/bin/env python3
"""
Batch update the DJ/Artist column (G) in the merged Shameless Google Sheet.
Spreadsheet row = # + 1 (row 1 is headers)
"""

import subprocess
import json
import os

SHEET_ID = "1XgN6Sgwt4t6jJiCTDZZPb-5gxiYdyGMrWbCa71NqJLk"
TAB = "Shameless past parties - MERGED"

# num_row: the # column value -> DJ/Artist lineup string
# All confirmed from Facebook event pages scraped via Chrome headless
LINEUPS = {
    204: "Joakim, Sappho, Kadeejah Streets, DJ Sheppard, Ginkgo, Andy Warren, Julie Herrera, Subset, Tyson Wittrock, Recess",
    213: "David Scuba, Succubass, Recess, Tyson Wittrock",
    218: "Recess",
    221: "Gina Turner, Tim Rothschild, Joe Burley, Recess",
    222: "Gina Turner, Porkchop, Saand, Joey Webb, Kinda, Recess, Joe Bellingham, Tyson Wittrock, Kadeejah Streets, Night Train, Konifer, ELLEM, The Love Virus, Rhett",
    229: "Clarian, Luke Mandala, Miss Shelrawka, Succubass, Cylc, Tyson Wittrock, Recess",
    236: "Dave DK, James Flavour, Joe Bellingham",
    239: "Lee Reynolds, Tara Brooks, Noah Pred, Luke Mandala, Nancy Dru, Brooke Would, The Perfect Cyn, Wesley Holmes, Recess, Sean Majors, Adlib, John Massey, Joe Bellingham, Rob Noble, Foofou, Tyson Wittrock, The Lovevirus",
    254: "Luke Mandala, Christian Martin",
    256: "Tara Brooks, Sappho, Miss Shelrawka, Moist Towelette",
    257: "Chris Tower, Josh Verse, Tyson Wittrock",
    258: "Nark, Riff Raff, Spaceotter",
    259: "FutureWife, CaseWag",
    260: "Cody Morrison, Tyler Morrison, Carlos Ruiz, Joel Pryde",
    261: "DJ Manos, Kadeejah Streets, Night Train, Recess",
    262: "J-Justice, Recess",
    263: "Deepchild, Codebase, Joe Bellingham, Recess, Adlib, Tyson Wittrock",
    264: "VonDewey, Lu Ying",
    266: "Joe Bellingham",
}

# Build the data ranges
# Spreadsheet row = # + 1
data_ranges = []
for num, lineup in LINEUPS.items():
    sheet_row = num + 1
    range_str = f"'{TAB}'!G{sheet_row}"
    data_ranges.append({
        "range": range_str,
        "values": [[lineup]]
    })

print(f"Preparing {len(data_ranges)} cell updates...")

params = json.dumps({"spreadsheetId": SHEET_ID})
body = json.dumps({
    "valueInputOption": "RAW",
    "data": data_ranges
})

cmd = [
    "gws", "sheets", "spreadsheets", "values", "batchUpdate",
    "--params", params,
    "--json", body,
]

result = subprocess.run(cmd, capture_output=True, text=True)
raw_output = result.stdout

# Strip the keyring line
lines = [l for l in raw_output.splitlines() if "keyring backend" not in l.lower()]
output = "\n".join(lines)

try:
    response = json.loads(output)
    if "error" in response:
        print(f"ERROR: {response['error']}")
    else:
        total = response.get("totalUpdatedCells", "?")
        rows = response.get("totalUpdatedRows", "?")
        print(f"Success! Updated {rows} rows ({total} cells total)")
        print(f"Spreadsheet ID: {response.get('spreadsheetId', SHEET_ID)}")
except json.JSONDecodeError as e:
    print(f"Parse error: {e}")
    print("Raw output:", raw_output[:500])

if result.returncode != 0:
    print("STDERR:", result.stderr[:300])
