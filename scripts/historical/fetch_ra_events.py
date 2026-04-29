#!/usr/bin/env python3
"""Fetch all Shameless Productions past events from RA GraphQL API and match to sheet rows."""

import subprocess, json, re, time

RA_PROMOTER_ID = "13758"
RA_URL = "https://ra.co/graphql"

def ra_query(year, limit=200):
    payload = {
        "query": f"""query {{
            promoter(id: "{RA_PROMOTER_ID}") {{
                events(type: ARCHIVE, limit: {limit}, year: {year}) {{
                    id title date
                    promotionalLinks {{ title url }}
                }}
            }}
        }}"""
    }
    cmd = ["curl", "-s", "--max-time", "15", "-A", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120",
           "-H", "Content-Type: application/json",
           "-H", "Referer: https://ra.co/promoters/13758",
           "--data", json.dumps(payload), RA_URL]
    r = subprocess.run(cmd, capture_output=True, text=True)
    try:
        d = json.loads(r.stdout)
        return d.get("data", {}).get("promoter", {}).get("events", []) or []
    except:
        return []

# Collect all RA events with FB links
all_ra_events = []
print("Fetching RA events year by year...")
for year in range(2010, 2020):
    events = ra_query(year)
    fb_events = []
    for e in events:
        links = e.get("promotionalLinks") or []
        fb_links = [l.get("url", "") for l in links if "facebook.com/events" in str(l.get("url", ""))]
        if fb_links:
            eid = re.search(r"/events/(\d+)", fb_links[0])
            if eid:
                fb_events.append({
                    "ra_id": e["id"],
                    "title": e["title"],
                    "date": str(e["date"])[:10],
                    "fb_event_id": eid.group(1),
                    "fb_url": fb_links[0].split("?")[0],
                })
    all_ra_events.extend(fb_events)
    if fb_events:
        print(f"  {year}: {len(events)} total events, {len(fb_events)} with FB links")
        for fe in fb_events:
            print(f"    {fe['date']} | {fe['title'][:55]} | {fe['fb_event_id']}")
    else:
        print(f"  {year}: {len(events)} events (no FB links)")
    time.sleep(0.3)

print(f"\nTotal RA events with FB URLs: {len(all_ra_events)}")

# Save
with open("/home/tekthree/zoo-bot/ra_events.json", "w") as f:
    json.dump(all_ra_events, f, indent=2, ensure_ascii=False)

# Load sheet data and match
with open("/home/tekthree/zoo-bot/sheet_data.json") as f:
    sheet_rows = json.load(f)

# Build lookup: date -> list of sheet rows
from datetime import datetime

def parse_date(s):
    """Parse dates like 'Sun, Apr 19, 2026' or '2016-05-30'"""
    for fmt in ["%Y-%m-%d", "%a, %b %d, %Y", "%b %d, %Y"]:
        try:
            return datetime.strptime(s.strip(), fmt).date()
        except:
            pass
    return None

# Build date map for missing rows
missing_rows = {}
for row in sheet_rows[1:]:
    num = int(row[0])
    fb_url = row[5] if len(row) > 5 else ""
    if not fb_url:
        date = parse_date(row[1] if len(row) > 1 else "")
        name = (row[2] if len(row) > 2 else "").lower()
        missing_rows[num] = {"date": date, "name": name, "raw_date": row[1] if len(row) > 1 else ""}

print(f"\nMissing rows: {len(missing_rows)}")

# Match RA events to missing rows
matches = {}
for ra_ev in all_ra_events:
    ra_date_str = ra_ev["date"]
    ra_date = parse_date(ra_date_str)
    ra_title = ra_ev["title"].lower()

    for num, row_data in missing_rows.items():
        if row_data["date"] and ra_date and row_data["date"] == ra_date:
            matches[num] = {
                "fb_url": f"https://www.facebook.com/events/{ra_ev['fb_event_id']}/",
                "fb_event_id": ra_ev["fb_event_id"],
                "ra_title": ra_ev["title"],
                "sheet_name": row_data["name"],
                "date": ra_date_str,
            }

print(f"\nMatched {len(matches)} rows by date:")
for num, m in sorted(matches.items()):
    print(f"  #{num}: {m['date']} | RA: {m['ra_title'][:45]} | FB: {m['fb_event_id']}")

with open("/home/tekthree/zoo-bot/ra_matches.json", "w") as f:
    json.dump(matches, f, indent=2, ensure_ascii=False)
