#!/usr/bin/env python3
"""
Extract lineup/DJ info from Facebook event HTML.
Uses "text":"..." pattern to find description blocks with artist names.
"""

import subprocess
import re
import json
import time
import html as html_lib

CHROME = "/home/tekthree/.cache/ms-playwright/chromium-1024/chrome-linux/chrome"

EVENTS = [
    (204, "226206561239966", "Your Sunday Best w/ Joakim"),
    (213, "1476683579042027", "Cascadia Festival 2017"),
    (218, "217452902054622", "Yo Yo Yoga March Forward"),
    (221, "1823113277902138", "The Divine Movement"),
    (222, "1787551408169466", "Breakfast Brunch Club"),
    (229, "1075022545906497", "Shameless at Cascadia - Clarian"),
    (236, "1573898012930850", "Shameless Hijinks Dave DK & James Flavour"),
    (239, "1446666932308049", "Breakfast Club dB2015 After"),
    (254, "637964586319112", "SA003 Luke Mandala"),
    (256, "562098630561902", "Deck'd Out Sunset Tonight"),
    (257, "1472266789724814", "Deck'd Out Sunset Tonight 2"),
    (258, "324702077697534", "Deck'd Out Bottom Forty"),
    (259, "562714170501705", "Deck'd Out Sunset"),
    (260, "748692038531864", "Deck'd Out High & Tight"),
    (261, "275789412628254", "Deck'd Out Innerflight"),
    (262, "339086639574651", "Deck'd Out Sunset"),
    (263, "781472851886031", "SA002 Deepchild and Codebase"),
    (264, "655409447875090", "Esthetic Evolution Sea Camp"),
    (266, "1420616551514766", "Joe Bellingham release"),
]

def fetch_event(event_id):
    url = f"https://www.facebook.com/events/{event_id}/"
    cmd = [
        CHROME, "--headless", "--disable-gpu", "--no-sandbox",
        "--disable-dev-shm-usage", "--virtual-time-budget=5000", "--dump-dom", url
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        return result.stdout
    except subprocess.TimeoutExpired:
        return ""

def decode_fb(s):
    s = s.replace('\\n', '\n').replace('\\r', '').replace('\\/', '/')
    s = s.replace('\\u2019', "'").replace('\\u2018', "'")
    s = s.replace('\\u201c', '"').replace('\\u201d', '"')
    s = s.replace('\\u2014', '-').replace('\\u2013', '-')
    s = s.replace('\\u00e9', 'é').replace('\\u00e0', 'à').replace('\\u00e8', 'è')
    s = html_lib.unescape(s)
    return s

def extract_text_blocks(html):
    """Extract all "text":"..." blocks from Facebook JSON, filter for long ones with lineup info."""
    # This pattern handles backslash-escaped characters in JSON strings
    blocks = []
    for m in re.finditer(r'"text"\s*:\s*"((?:[^"\\]|\\.)*)"', html):
        text = decode_fb(m.group(1))
        if len(text) > 150:  # Only substantial blocks
            blocks.append(text)
    return blocks

def og_description(html):
    """Get the OG meta description."""
    m = re.search(r'<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']+)["\']', html)
    if m:
        return html_lib.unescape(m.group(1))
    return None

def og_title(html):
    m = re.search(r'<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']+)["\']', html)
    if m:
        return html_lib.unescape(m.group(1))
    return None

results = {}

for row, event_id, label in EVENTS:
    print(f"\n{'='*60}")
    print(f"ROW {row} | {label} | Event {event_id}")

    html = fetch_event(event_id)
    if len(html) < 100000:
        print("LOGIN WALL")
        results[row] = {"status": "login_wall"}
        continue

    title = og_title(html)
    desc_short = og_description(html)
    print(f"Title: {title}")

    blocks = extract_text_blocks(html)

    # Find the most useful block (longest, or contains DJ-related keywords)
    dj_blocks = []
    for b in blocks:
        if any(kw in b.lower() for kw in ['dj', 'lineup', 'present', 'featuring', 'techno', 'house', 'records', 'soundcloud', 'resident', 'showcase', 'music']):
            dj_blocks.append(b)

    # Also take the longest block regardless
    all_blocks_sorted = sorted(blocks, key=len, reverse=True)

    if dj_blocks:
        best = max(dj_blocks, key=len)
        print(f"\nBest DJ block ({len(best)} chars):")
        print(best[:2000])
    elif all_blocks_sorted:
        best = all_blocks_sorted[0]
        print(f"\nLongest block ({len(best)} chars):")
        print(best[:2000])
    else:
        print("No substantial text blocks found")
        best = None

    results[row] = {
        "event_id": event_id,
        "label": label,
        "title": title,
        "og_description": desc_short,
        "best_block": best,
        "all_blocks_count": len(blocks),
    }

    time.sleep(0.5)

# Save
with open("/home/tekthree/zoo-bot/fb_lineup_details2.json", "w") as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

print(f"\n\nSaved to fb_lineup_details2.json")
print("\nSUMMARY:")
for row, data in sorted(results.items()):
    has_data = bool(data.get('best_block'))
    print(f"  Row {row}: {'HAS DATA' if has_data else 'NO DATA'} | {data.get('title', 'N/A')}")
