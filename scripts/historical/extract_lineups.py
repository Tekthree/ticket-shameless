#!/usr/bin/env python3
"""
Deep-extract lineup/DJ info from Facebook event HTML.
Dumps description text for each event for manual review + structured extraction.
"""

import subprocess
import re
import json
import time
import html as html_lib

CHROME = "/home/tekthree/.cache/ms-playwright/chromium-1024/chrome-linux/chrome"

EVENTS = [
    (204, "226206561239966", "Your Sunday Best w/ Joakim + More!"),
    (213, "1476683579042027", "Cascadia Festival 2017 Shameless Showcase"),
    (218, "217452902054622", "Yo Yo Yoga Presents"),
    (221, "1823113277902138", "The Divine Movement"),
    (222, "1787551408169466", "The Breakfast Brunch Club"),
    (229, "1075022545906497", "Shameless Showcase at Cascadia"),
    (236, "1573898012930850", "Shameless Hijinks with Dave DK & James Flavour"),
    (239, "1446666932308049", "Breakfast Club dB2015 After"),
    (254, "637964586319112", "SA003 Luke Mandala"),
    (256, "562098630561902", "Deck'd Out Sunset"),
    (257, "1472266789724814", "Deck'd Out Sunset"),
    (258, "324702077697534", "Deck'd Out Sunset Hijinks BOTTOM FORTY"),
    (259, "562714170501705", "Deck'd Out Sunset"),
    (260, "748692038531864", "Deck'd Out Sunset High & Tight"),
    (261, "275789412628254", "Deck'd Out Sunset Innerflight"),
    (262, "339086639574651", "Deck'd Out Sunset"),
    (263, "781472851886031", "SA002 Release Party - Deepchild and Codebase"),
    (264, "655409447875090", "Esthetic Evolution Sea Camp"),
    (266, "1420616551514766", "Beatport release Joe Bellingham"),
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

def decode_fb_text(s):
    """Decode Facebook's escaped text."""
    s = s.replace('\\n', '\n').replace('\\r', '').replace('\\/', '/')
    s = s.replace('\\u2019', "'").replace('\\u2018', "'")
    s = s.replace('\\u201c', '"').replace('\\u201d', '"')
    s = s.replace('\\u2014', '-').replace('\\u2013', '-')
    s = s.replace('\\u00e9', 'e').replace('\\u00e0', 'a').replace('\\u00e8', 'e')
    s = s.replace('\\u00fc', 'u').replace('\\u00f6', 'o').replace('\\u00e4', 'a')
    s = s.replace('\\u00e2', 'a').replace('\\u00ea', 'e').replace('\\u00ee', 'i')
    s = html_lib.unescape(s)
    return s

def extract_descriptions(html):
    """Extract all description text blocks from Facebook event HTML."""
    descriptions = []

    # Pattern: "description":{"text":"..."}
    for m in re.finditer(r'"description"\s*:\s*\{\s*"text"\s*:\s*"((?:[^"\\]|\\.)*)"\s*\}', html):
        text = decode_fb_text(m.group(1))
        if len(text) > 50:
            descriptions.append(text)

    return descriptions

def extract_event_name(html):
    """Extract event name from og:title."""
    m = re.search(r'<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']+)["\']', html)
    if m:
        t = html_lib.unescape(m.group(1).strip())
        return t
    return None

def extract_performers_from_graphql(html):
    """Extract performer objects from GraphQL payload."""
    performers = []

    # Look for EventPerformer or similar types
    # Pattern: {"__typename":"EventPerformer","name":"DJ Name",...}
    for m in re.finditer(r'\{[^}]*"__typename"\s*:\s*"([^"]+)"[^}]*\}', html):
        obj_str = m.group(0)
        typename = m.group(1)
        if typename in ('EventPerformer', 'Artist', 'Musician', 'Performer'):
            name_m = re.search(r'"name"\s*:\s*"([^"]{2,60})"', obj_str)
            if name_m:
                performers.append(name_m.group(1))

    return performers

results = {}

for row, event_id, label in EVENTS:
    print(f"\n{'='*60}")
    print(f"ROW {row} | {label}")
    print(f"Event ID: {event_id}")

    html = fetch_event(event_id)
    if len(html) < 100000:
        print("LOGIN WALL")
        results[row] = {"status": "login_wall"}
        continue

    event_name = extract_event_name(html)
    print(f"Title: {event_name}")

    performers = extract_performers_from_graphql(html)
    if performers:
        print(f"GraphQL performers: {performers}")

    descs = extract_descriptions(html)
    print(f"Description blocks found: {len(descs)}")

    # Print the longest/most relevant description
    if descs:
        # Sort by length, take up to 3
        descs_sorted = sorted(descs, key=len, reverse=True)
        for i, d in enumerate(descs_sorted[:2]):
            print(f"\n--- Description {i+1} ({len(d)} chars) ---")
            print(d[:1500])
            print("...")

    results[row] = {
        "event_id": event_id,
        "label": label,
        "event_name": event_name,
        "performers": performers,
        "descriptions": descs[:3] if descs else [],
    }

    time.sleep(0.5)

# Save full results
with open("/home/tekthree/zoo-bot/fb_lineup_details.json", "w") as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

print(f"\n\nSaved to fb_lineup_details.json")
