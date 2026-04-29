#!/usr/bin/env python3
"""
Comprehensive Google Sheet update for Shameless past parties.
1. Construct banner image URLs from event IDs (all rows with FB URL)
2. Fill DJ/Artist from event names where extractable
3. Scrape Facebook past events page for missing event URLs
4. Scrape individual event pages for full description + DJ info (rows with FB URL but missing DJ)
"""

import subprocess
import re
import json
import time
import html as html_lib

SHEET_ID = "1XgN6Sgwt4t6jJiCTDZZPb-5gxiYdyGMrWbCa71NqJLk"
TAB = "Shameless past parties - MERGED"
CHROME = "/home/tekthree/.cache/ms-playwright/chromium-1024/chrome-linux/chrome"

# ─── Load sheet data ────────────────────────────────────────────────────────
with open("/home/tekthree/zoo-bot/sheet_data.json") as f:
    all_rows = json.load(f)

header = all_rows[0]
data_rows = all_rows[1:]  # rows 1-297

def row_to_dict(row):
    keys = ["num", "date", "name", "venue", "organizer", "fb_url", "dj", "banner", "img", "desc"]
    d = {}
    for i, k in enumerate(keys):
        d[k] = row[i] if i < len(row) else ""
    d["num"] = int(d["num"])
    return d

rows = [row_to_dict(r) for r in data_rows]

# ─── Helper: extract event ID from FB URL ───────────────────────────────────
def event_id_from_url(url):
    m = re.search(r'/events/(\d+)', url)
    return m.group(1) if m else None

def banner_url_from_event_id(eid):
    return f"https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id={eid}"

# ─── Helper: fetch FB event page ────────────────────────────────────────────
def fetch_fb_page(url):
    cmd = [CHROME, "--headless", "--disable-gpu", "--no-sandbox",
           "--disable-dev-shm-usage", "--virtual-time-budget=5000", "--dump-dom", url]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        return r.stdout
    except subprocess.TimeoutExpired:
        return ""

def decode_fb(s):
    s = s.replace('\\n', '\n').replace('\\r', '').replace('\\/', '/')
    s = s.replace('\\u2019', "'").replace('\\u2018', "'")
    s = s.replace('\\u201c', '"').replace('\\u201d', '"')
    s = s.replace('\\u2014', '-').replace('\\u2013', '-')
    return html_lib.unescape(s)

def extract_text_blocks(html):
    blocks = []
    for m in re.finditer(r'"text"\s*:\s*"((?:[^"\\]|\\.)*)"', html):
        text = decode_fb(m.group(1))
        if len(text) > 150:
            blocks.append(text)
    return blocks

def get_og_image(html):
    m = re.search(r'property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']', html)
    if not m:
        m = re.search(r'content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']', html)
    return html_lib.unescape(m.group(1)) if m else None

def get_og_title(html):
    m = re.search(r'property=["\']og:title["\'][^>]+content=["\']([^"\']+)["\']', html)
    if not m:
        m = re.search(r'content=["\']([^"\']+)["\'][^>]+property=["\']og:title["\']', html)
    return html_lib.unescape(m.group(1)) if m else None

# ─── Phase 1: DJ extraction from event names ────────────────────────────────
# Manually curated based on event name patterns
NAME_DJ_MAP = {
    187: "Oscar L",
    200: "Anabel Englund",
    202: "DJ Three",
    205: "Fabe Canepari",
    208: "Pettarlas",
    209: "Sinca",
    211: "Saqib, Dave Pezzner",
    217: "Mikey Lion, Lee Reynolds, Marbs",
    219: "DJ Assault",
    228: "DJ Manos, Kadeejah Streets, Night Train",  # Innerflight Showcase
    235: "Mikey Lion, Lee Reynolds, Marbs",
    237: "Mr. C, David Scuba, Jon Cates",
    238: "DJ Three",
    245: "Saqib, Dave Pezzner",
    251: "Mikey Lion, Lee Reynolds, Marbs",
    255: "Christian Martin, Dave Pezzner, Luke Mandala, Codebase",
    267: "James Flavour, Jeff Samuel",
    271: "Pete The Shaker",
    274: "J.Phlip",
    275: "Lusine",
    276: "Codebase",
    277: "Dave Nada",
    278: "Lorn",
    279: "Smash TV",
    282: "Moomin",
    283: "Smash TV, Oliver Koletzki",
    285: "Stephan Bodzin",
    286: "Wareika Hill Sounds",
    287: "Shackleton",
    288: "Pole, Pendle Coven",
}

# ─── Phase 2: Scrape FB past events page to find missing event URLs ──────────
print("Phase 2: Scraping Shameless Facebook past events page...")
fb_past_url = "https://www.facebook.com/shamelessinseattle/past_hosted_events"
html_past = fetch_fb_page(fb_past_url)
print(f"  Page size: {len(html_past):,} bytes")

# Extract event URLs from the page
found_event_ids = {}  # event_id -> event_name

if len(html_past) > 100000:
    # Find all event URLs: /events/EVENT_ID or /events/SLUG/EVENT_ID/
    event_urls = re.findall(r'https?://www\.facebook\.com/events/([^/"]+)/([^/"]*)/(\d+)', html_past)
    event_ids_direct = re.findall(r'"url"\s*:\s*"https?://www\\.facebook\\.com/events/(\d+)/', html_past)

    # Also look for event IDs in JSON
    for m in re.finditer(r'/events/(\d{8,})', html_past):
        eid = m.group(1)
        found_event_ids[eid] = True

    print(f"  Found {len(found_event_ids)} unique event IDs on the past events page")
else:
    print("  Page too small - login wall or incomplete load")

# ─── Phase 3: Match missing rows to found event URLs ────────────────────────
# For rows missing FB URL, try to find the event by date+name matching
missing_url_rows = [r for r in rows if not r["fb_url"]]
print(f"\nPhase 3: Trying to match {len(missing_url_rows)} rows missing FB URL")

# Let me try a different approach - search FB for each missing event
# using the Chrome headless binary to search for the event name
def search_fb_event(name, date_str):
    """Try to find a Facebook event URL by searching the event name on the Shameless page."""
    # Try Google-style approach: search Facebook for the event
    # Actually just try /events/ path with known patterns
    return None

# ─── Phase 4: For rows with FB URL, scrape for description + banner ──────────
# Get rows that have FB URL but missing banner OR missing DJ
needs_scrape = []
for r in rows:
    eid = event_id_from_url(r["fb_url"])
    has_banner = bool(r["banner"] or r["img"])
    has_dj = bool(r["dj"])
    if eid and (not has_banner or not has_dj):
        needs_scrape.append(r)

print(f"\nPhase 4: Scraping {len(needs_scrape)} event pages for banner+DJ info")
print("(This will take several minutes...)")

scraped_data = {}  # num -> {banner, dj, desc}

for i, r in enumerate(needs_scrape):
    eid = event_id_from_url(r["fb_url"])
    url = f"https://www.facebook.com/events/{eid}/"

    print(f"  [{i+1}/{len(needs_scrape)}] #{r['num']}: {r['name'][:45]}...", end="", flush=True)

    html = fetch_fb_page(url)
    if len(html) < 100000:
        print(" [LOGIN WALL]")
        scraped_data[r["num"]] = {"status": "login_wall"}
        time.sleep(0.3)
        continue

    banner = get_og_image(html)
    if not banner:
        banner = banner_url_from_event_id(eid)

    blocks = extract_text_blocks(html)
    dj_blocks = [b for b in blocks if any(
        kw in b.lower() for kw in ['featuring', 'lineup', 'dj', 'presents', 'soundcloud', 'residentadvisor', 'records', 'music', 'techno', 'house']
    )]
    best_desc = max(dj_blocks, key=len) if dj_blocks else (max(blocks, key=len) if blocks else "")

    scraped_data[r["num"]] = {
        "status": "ok",
        "banner": banner,
        "desc": best_desc[:3000] if best_desc else "",
    }

    print(f" banner={'YES' if banner else 'NO'} | desc={len(best_desc)}c")
    time.sleep(0.8)

# Save scraped data
with open("/home/tekthree/zoo-bot/scraped_event_data.json", "w") as f:
    json.dump(scraped_data, f, indent=2, ensure_ascii=False)

print(f"\nSaved scraped data for {len(scraped_data)} events")

# ─── Build update payload ────────────────────────────────────────────────────
print("\nBuilding sheet update payload...")

update_ranges = []

for r in rows:
    num = r["num"]
    sheet_row = num + 1  # row 1 = header, data starts at row 2

    eid = event_id_from_url(r["fb_url"])

    # Banner: construct from event ID if we have it and no banner yet
    if eid and not r["banner"] and not r["img"]:
        new_banner = scraped_data.get(num, {}).get("banner") or banner_url_from_event_id(eid)
        if new_banner:
            update_ranges.append({
                "range": f"'{TAB}'!H{sheet_row}",
                "values": [[new_banner]]
            })

    # DJ: from name map or scraped description
    if not r["dj"]:
        new_dj = NAME_DJ_MAP.get(num)
        if new_dj:
            update_ranges.append({
                "range": f"'{TAB}'!G{sheet_row}",
                "values": [[new_dj]]
            })

    # Full description: from scrape
    scraped = scraped_data.get(num, {})
    if scraped.get("desc") and not r["desc"]:
        update_ranges.append({
            "range": f"'{TAB}'!J{sheet_row}",
            "values": [[scraped["desc"]]]
        })

print(f"Total updates to apply: {len(update_ranges)}")

# ─── Apply updates in batches of 100 ────────────────────────────────────────
def batch_update(data_ranges):
    params = json.dumps({"spreadsheetId": SHEET_ID})
    body = json.dumps({"valueInputOption": "RAW", "data": data_ranges})
    cmd = ["gws", "sheets", "spreadsheets", "values", "batchUpdate",
           "--params", params, "--json", body]
    result = subprocess.run(cmd, capture_output=True, text=True)
    lines = [l for l in result.stdout.splitlines() if "keyring" not in l.lower()]
    try:
        resp = json.loads("\n".join(lines))
        return resp
    except:
        return {"error": result.stdout[:200]}

BATCH_SIZE = 100
total_cells = 0
for start in range(0, len(update_ranges), BATCH_SIZE):
    batch = update_ranges[start:start + BATCH_SIZE]
    resp = batch_update(batch)
    if "error" in resp:
        print(f"  ERROR in batch {start//BATCH_SIZE + 1}: {resp['error']}")
    else:
        cells = resp.get("totalUpdatedCells", 0)
        total_cells += cells
        print(f"  Batch {start//BATCH_SIZE + 1}: {cells} cells updated")

print(f"\nDone! Total cells updated: {total_cells}")
