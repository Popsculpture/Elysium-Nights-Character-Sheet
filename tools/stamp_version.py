"""Stamp a cache-busting version onto every local asset in app/index.html.

WHY THIS EXISTS
    GitHub Pages serves this site with "Cache-Control: max-age=600" on everything,
    the HTML included, and none of it can be configured from the repo. Without a
    version on the asset URLs, a browser holding a cached js/ui.js will happily pair
    it with a freshly fetched data/rules.js, because each file expires on its own
    clock. That mismatch is the real hazard: not that a deploy is seen late, but that
    half of one build runs against half of another.

    Stamping the URLs makes a deploy ATOMIC. Every asset the HTML names changes name
    together, so the moment the HTML refreshes the whole build swaps at once and a
    half-and-half state cannot occur. It does NOT make the deploy arrive faster: the
    HTML still carries its own ten minute cache, and nothing in this repo can shorten
    that. Latency was never the dangerous half.

WHEN TO RUN IT
    Once per deploy, before committing, whenever anything under app/ changed:

        python tools/stamp_version.py

    It is idempotent. Running it twice in a day yields .1 then .2, and running it
    with no changes to ship is harmless. To undo it completely:

        python tools/stamp_version.py --strip

WHAT IT WILL NOT TOUCH
    Absolute URLs, so the Google Fonts stylesheet keeps its own query untouched. Only
    relative paths inside app/index.html are stamped.
"""

import io
import os
import re
import sys
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET = os.path.join(ROOT, "app", "index.html")

# src=" or href=" on a script or link tag. Both character classes are negated sets
# with no backslash in them, which matters: a class written [^"\] escapes its own
# closing bracket and silently swallows the rest of the pattern.
ASSET = re.compile(r'(<(?:script|link)\b[^>]*?\b(?:src|href)=")([^"]+)(")')
STAMP = re.compile(r'^(?P<path>[^?]+)(?:\?v=(?P<ver>[0-9]{8}\.[0-9]+))?$')


def is_local(url):
    return not url.startswith(("http://", "https://", "//", "data:"))


def current_version(text):
    seen = re.findall(r'\?v=([0-9]{8}\.[0-9]+)', text)
    return sorted(seen)[-1] if seen else None


def next_version(text):
    today = date.today().strftime("%Y%m%d")
    cur = current_version(text)
    if cur and cur.split(".")[0] == today:
        return "%s.%d" % (today, int(cur.split(".")[1]) + 1)
    return "%s.1" % today


def rewrite(text, version):
    """version=None strips the stamp instead of setting one."""
    stats = {"stamped": 0, "skipped": 0}

    def repl(m):
        head, url, tail = m.group(1), m.group(2), m.group(3)
        if not is_local(url):
            stats["skipped"] += 1
            return m.group(0)
        parts = STAMP.match(url)
        path = parts.group("path") if parts else url.split("?")[0]
        stats["stamped"] += 1
        return head + (path if version is None else "%s?v=%s" % (path, version)) + tail

    return ASSET.sub(repl, text), stats


def main():
    strip = "--strip" in sys.argv
    text = io.open(TARGET, encoding="utf-8").read()
    version = None if strip else next_version(text)

    out, stats = rewrite(text, version)

    if out == text:
        print("app/index.html unchanged (already at %s)" % (current_version(text) or "no version"))
        return

    io.open(TARGET, "w", encoding="utf-8", newline="").write(out)
    print("%s %d local assets in app/index.html%s" % (
        "stripped" if strip else "stamped",
        stats["stamped"],
        "" if strip else " -> ?v=%s" % version))
    print("left %d absolute URLs alone" % stats["skipped"])


if __name__ == "__main__":
    main()
