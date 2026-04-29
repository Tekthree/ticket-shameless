#!/usr/bin/env python3
"""
1. Scrape the 16 RA-matched Facebook event pages for DJ/description data.
2. Batch-update the sheet with FB URLs, banners, DJs, and descriptions.
"""

import subprocess, json, re, time
import html as html_module

SHEET_ID = "1XgN6Sgwt4t6jJiCTDZZPb-5gxiYdyGMrWbCa71NqJLk"
TAB = "Shameless past parties - MERGED"
CHROME = "/home/tekthree/.cache/ms-playwright/chromium-1024/chrome-linux/chrome"

with open("/home/tekthree/zoo-bot/ra_matches.json") as f:
    matches = json.load(f)  # {str(num): {fb_url, fb_event_id, ra_title, ...}}

with open("/home/tekthree/zoo-bot/sheet_data.json") as f:
    sheet_rows = json.load(f)

# Build quick lookup for existing DJ data
existing = {}
for row in sheet_rows[1:]:
    num = int(row[0])
    existing[num] = {
        "dj": row[6] if len(row) > 6 else "",
        "banner": row[7] if len(row) > 7 else "",
        "desc": row[9] if len(row) > 9 else "",
    }

def fetch_page(url):
    cmd = [CHROME, "--headless", "--disable-gpu", "--no-sandbox",
           "--disable-dev-shm-usage", "--virtual-time-budget=5000", "--dump-dom", url]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        return r.stdout
    except:
        return ""

def decode_fb(s):
    s = s.replace("\\n", "\n").replace("\\r", "").replace("\\/", "/")
    s = s.replace("\\u2019", "'").replace("\\u2018", "'")
    s = s.replace("\\u201c", '"').replace("\\u201d", '"')
    s = s.replace("\\u2014", "-").replace("\\u2013", "-")
    return html_module.unescape(s)

def extract_best_block(html):
    blocks = []
    for m in re.finditer(r'"text"\s*:\s*"((?:[^"\\]|\\.)*)"', html):
        text = decode_fb(m.group(1))
        if len(text) > 150:
            blocks.append(text)
    if not blocks:
        return ""
    dj_blocks = [b for b in blocks if any(
        kw in b.lower() for kw in ["dj", "featuring", "lineup", "presents", "soundcloud", "records", "music", "techno", "house"]
    )]
    return max(dj_blocks, key=len) if dj_blocks else max(blocks, key=len)

def get_og_image(html):
    m = re.search(r'property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']', html)
    if not m:
        m = re.search(r'content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']', html)
    return html_module.unescape(m.group(1)) if m else None

# DJ info from RA titles (supplement)
RA_TITLE_DJS = {
    224: "Late Night Munchies crew",
    226: "Dave Pezzner",
    228: "Jon Lee, Trinitron, Joey Webb",
    230: "Grounded Records crew",
    232: "Hanssen",
    233: "DJ Sean, Tane",
    234: "Orqid",
    235: "Lee Reynolds, Mikey Lion, Marbs",
    240: "Kid Hops, Riz Rollins, Sharlese",
    241: "Natural Magic, Time and Place",
    244: "Shameless Residents",
    245: "Smash TV, Mo' Penguins",
    267: "James Flavour, Jeff Samuel",
}

# Scrape event pages
print(f"Scraping {len(matches)} RA-matched event pages...")
scraped = {}

for num_str, m in sorted(matches.items(), key=lambda x: int(x[0])):
    num = int(num_str)
    eid = m["fb_event_id"]
    url = f"https://www.facebook.com/events/{eid}/"
    print(f"  #{num}: {m['ra_title'][:45]}... ", end="", flush=True)

    # Skip row 268 (already updated)
    if num == 268:
        print("(already updated, skipping scrape)")
        continue

    html = fetch_page(url)
    if len(html) < 100000:
        print("[LOGIN WALL]")
        scraped[num] = {"status": "login_wall", "banner": f"https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id={eid}"}
        time.sleep(0.3)
        continue

    banner = get_og_image(html) or f"https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id={eid}"
    desc = extract_best_block(html)
    print(f"OK | desc={len(desc)}c")

    scraped[num] = {"status": "ok", "banner": banner, "desc": desc[:3000]}
    time.sleep(0.7)

# Build update ranges
print("\nBuilding sheet updates...")
update_ranges = []

for num_str, m in matches.items():
    num = int(num_str)
    sheet_row = num + 1

    # FB URL
    update_ranges.append({
        "range": f"'{TAB}'!F{sheet_row}",
        "values": [[f"https://www.facebook.com/events/{m['fb_event_id']}/"]]
    })

    # Banner (if not already set)
    if not existing.get(num, {}).get("banner"):
        banner = scraped.get(num, {}).get("banner") or f"https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id={m['fb_event_id']}"
        update_ranges.append({"range": f"'{TAB}'!H{sheet_row}", "values": [[banner]]})

    # DJ (if not already set)
    if not existing.get(num, {}).get("dj"):
        # Try scraped description first, then RA title map
        dj = RA_TITLE_DJS.get(num, "")
        update_ranges.append({"range": f"'{TAB}'!G{sheet_row}", "values": [[dj]]}) if dj else None

    # Description (if not already set and we have one)
    desc = scraped.get(num, {}).get("desc", "")
    if desc and not existing.get(num, {}).get("desc"):
        update_ranges.append({"range": f"'{TAB}'!J{sheet_row}", "values": [[desc]]})

print(f"Total updates: {len(update_ranges)}")

# Apply
def batch_update(data_ranges):
    params = json.dumps({"spreadsheetId": SHEET_ID})
    body = json.dumps({"valueInputOption": "RAW", "data": data_ranges})
    cmd = ["gws", "sheets", "spreadsheets", "values", "batchUpdate", "--params", params, "--json", body]
    r = subprocess.run(cmd, capture_output=True, text=True)
    lines = [l for l in r.stdout.splitlines() if "keyring" not in l.lower()]
    try:
        return json.loads("\n".join(lines))
    except:
        return {"error": r.stdout[:200]}

BATCH = 100
total = 0
for i in range(0, len(update_ranges), BATCH):
    batch = update_ranges[i:i+BATCH]
    resp = batch_update(batch)
    if "error" in resp:
        print(f"  ERROR batch {i//BATCH+1}: {resp['error']}")
    else:
        c = resp.get("totalUpdatedCells", 0)
        total += c
        print(f"  Batch {i//BATCH+1}: {c} cells")

print(f"\nDone. Total cells updated: {total}")
