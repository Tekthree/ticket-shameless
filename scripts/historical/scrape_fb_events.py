#!/usr/bin/env python3
"""
Scrape Facebook event pages for DJ/Artist lineup data.
Uses Chrome headless binary with virtual-time-budget=5000 to catch content before JS redirect.
"""

import subprocess
import re
import json
import time
import sys

CHROME = "/home/tekthree/.cache/ms-playwright/chromium-1024/chrome-linux/chrome"

# Sheet row -> event ID mapping (row 203 is LOGIN_WALL, skip it)
EVENTS = [
    (204, "226206561239966"),
    (213, "1476683579042027"),
    (218, "217452902054622"),
    (221, "1823113277902138"),
    (222, "1787551408169466"),
    (229, "1075022545906497"),
    (236, "1573898012930850"),
    (239, "1446666932308049"),
    (254, "637964586319112"),
    (256, "562098630561902"),
    (257, "1472266789724814"),
    (258, "324702077697534"),
    (259, "562714170501705"),
    (260, "748692038531864"),
    (261, "275789412628254"),
    (262, "339086639574651"),
    (263, "781472851886031"),
    (264, "655409447875090"),
    (266, "1420616551514766"),
]

def fetch_event(event_id):
    url = f"https://www.facebook.com/events/{event_id}/"
    cmd = [
        CHROME,
        "--headless",
        "--disable-gpu",
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--virtual-time-budget=5000",
        "--dump-dom",
        url
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        return result.stdout
    except subprocess.TimeoutExpired:
        return ""

def extract_performers(html):
    """Extract performer/DJ names from Facebook event HTML."""
    performers = set()

    # Pattern 1: performers in GraphQL JSON blob
    # Look for performer objects
    perf_patterns = [
        r'"__typename":"(?:EventPerformer|Page|Artist|Musician|Performer)"[^}]*?"name":"([^"]{2,60})"',
        r'"name":"([^"]{2,60})"[^}]*?"__typename":"(?:EventPerformer|Page|Artist|Musician|Performer)"',
        r'"performers?":\[({[^]]+})\]',
    ]

    for pat in perf_patterns[:2]:
        matches = re.findall(pat, html)
        for m in matches:
            name = m.strip()
            if name and len(name) > 1:
                performers.add(name)

    # Pattern 2: lineup in event description text
    # Look for keywords like "Featuring:", "Lineup:", "DJs:", etc.
    desc_patterns = [
        r'(?:Featuring|Lineup|DJs?|Artists?|Music by|Performers?)[:：]\s*([^\n<]{5,200})',
        r'(?:featuring|lineup|djs?|artists?|music by|performers?)[:：]\s*([^\n<]{5,200})',
    ]

    for pat in desc_patterns:
        matches = re.findall(pat, html)
        for m in matches:
            # Clean up HTML entities
            m = m.replace('\\n', ' ').replace('&#039;', "'").replace('&amp;', '&').replace('&quot;', '"')
            performers.add(f"[DESC] {m.strip()}")

    # Pattern 3: event description text block
    desc_matches = re.findall(r'"description"\s*:\s*\{"text"\s*:\s*"([^"]{20,})"', html)
    for d in desc_matches[:3]:
        d_clean = d.replace('\\n', '\n').replace('&#039;', "'").replace('&amp;', '&')
        # Look for DJ/lineup info in description
        lines = d_clean.split('\n')
        for line in lines:
            line = line.strip()
            if re.search(r'(?:DJ|dj|featuring|lineup|presents|music by)', line, re.IGNORECASE):
                if 5 < len(line) < 200:
                    performers.add(f"[DESC] {line}")

    return performers

def extract_event_title(html):
    """Extract event title from HTML."""
    # Try og:title meta tag
    m = re.search(r'<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']+)["\']', html)
    if m:
        return m.group(1).strip()
    # Try title tag
    m = re.search(r'<title>([^<]+)</title>', html)
    if m:
        title = m.group(1).replace(' | Facebook', '').strip()
        return title
    return None

results = {}

print(f"Scraping {len(EVENTS)} Facebook event pages...")
print("=" * 60)

for row, event_id in EVENTS:
    url = f"https://www.facebook.com/events/{event_id}/"
    print(f"Row {row} | Event {event_id}... ", end="", flush=True)

    html = fetch_event(event_id)
    size = len(html)

    if size < 100000:
        print(f"LOGIN WALL ({size:,} bytes)")
        results[row] = {"event_id": event_id, "status": "login_wall", "performers": [], "title": None}
        continue

    title = extract_event_title(html)
    performers = extract_performers(html)

    print(f"OK ({size:,} bytes) | Title: {title or 'unknown'}")
    if performers:
        for p in sorted(performers):
            print(f"  -> {p}")
    else:
        print(f"  -> (no performers found)")

    results[row] = {
        "event_id": event_id,
        "status": "ok",
        "title": title,
        "performers": sorted(performers),
        "html_size": size,
    }

    # Small delay to be polite
    time.sleep(1)

print("\n" + "=" * 60)
print("SUMMARY")
print("=" * 60)

# Save results
with open("/home/tekthree/zoo-bot/fb_event_results.json", "w") as f:
    json.dump(results, f, indent=2)

print(f"Results saved to fb_event_results.json")
print(f"Total: {len(results)} events processed")
ok = sum(1 for r in results.values() if r["status"] == "ok")
found = sum(1 for r in results.values() if r["status"] == "ok" and r["performers"])
print(f"Accessible: {ok} | With performer data: {found}")
