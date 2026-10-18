"""Search the swipe library for inspiration.

    python "Scripts/Search Library.py" "belief shift cover that stings" -n 8
    python "Scripts/Search Library.py" "transition between slides" --genre Build
    python "Scripts/Search Library.py" --angle "How I" --tag cover-has-limit-or-credential
    python "Scripts/Search Library.py" --cta "Comment a word" --offer "paid offer" --tag proof-early
    python "Scripts/Search Library.py" --show 75        # the full post, slide copy and notes
    python "Scripts/Search Library.py" --slides 75      # only the slide copy, numbered
    python "Scripts/Search Library.py" --list-tags      # every tag and how many posts carry it

Query words are matched against cover, title, tags, the notes on why a post worked, the CTA and every slide.
Filters narrow the pool. A query with no filters ranks all 116 swiped posts and the 16 Tinna Loaiza posts.
"""
import argparse, json, os, re, sys, collections

sys.stdout.reconfigure(encoding="utf-8")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB = json.load(open(os.path.join(ROOT, "Library", "Library Index.json"), encoding="utf-8"))

SYN = {
    "transition": "forward-links pivot turn bridge but here's next now then",
    "transitions": "forward-links pivot turn bridge but here's next",
    "flow": "forward-links question chain next link",
    "belief": "myth reframe wrong belief believe old assume",
    "shift": "reframe turn pivot break change",
    "ask": "cta comment keyword offer dm",
    "cta": "comment keyword offer dm waitlist apply",
    "proof": "receipt receipts number screenshot proof credential result",
    "receipts": "proof number screenshot result",
    "cover": "cover headline hook",
    "hook": "cover headline opener",
    "story": "story case study personal",
    "objection": "objection doubt but what if",
    "close": "recap close ending final",
    "ending": "recap close ending final",
    "recap": "recap summary close",
    "enemy": "enemy attack sucks wrong myth",
    "framework": "framework levels ladder named system formula",
    "permission": "permission you don't need even if",
    "humility": "self-correction admission wrong honest",
    "humble": "self-correction admission wrong honest",
}


def toks(q):
    base = [w for w in re.findall(r"[\w'’-]+", q.lower()) if len(w) > 2]
    ext = []
    for w in base:
        ext += SYN.get(w, "").split()
    return base, ext


def field(r, k):
    v = r.get(k, "")
    if isinstance(v, list):
        v = " ".join(str(x) for x in v)
    return (v or "").lower()


def score(r, base, ext):
    sc = 0.0
    parts = [
        (field(r, "cover") + " " + field(r, "cover_head"), 3.0), (field(r, "title"), 3.0), (field(r, "tags"), 2.5),
        (field(r, "genre") + " " + field(r, "cover_angles"), 2.0), (field(r, "notes") + " " + field(r, "why"), 2.0),
        (field(r, "cta_text") + " " + field(r, "cta_kind") + " " + field(r, "cta_offers") + " " + field(r, "cta_framing"), 1.5),
        (field(r, "slide_text"), 1.0),
    ]
    for w in base:
        for txt, wt in parts:
            if w in txt:
                sc += wt
    for w in ext:
        for txt, wt in parts:
            if w in txt:
                sc += wt * 0.35
    return sc


def one_line(r):
    if r["source"] == "tinna":
        return f"T{r['n']:02d} | {r['title']} | {r['likes']:,} likes, {r['comments']:,} comments ({r['ratio']}%) | CTA: {r['cta']}\n      file: {r['file']}"
    tags = ", ".join(r.get("tags", [])[:7])
    cover = (r.get("cover") or "")[:140]
    why = (r.get("why") or "")[:260]
    cta = r.get("cta_kind", "")
    if r.get("cta_word"):
        cta += f" '{r['cta_word']}'"
    if r.get("cta_offers"):
        cta += " -> " + ", ".join(r["cta_offers"])
    return (f"#{r['n']:03d} | {r['title']} | {r.get('account','')} | {r.get('genre','')} | {r.get('declared_slides') or r.get('slide_count_parsed')} slides\n"
            f"      cover: {cover}\n      angle: {', '.join(r.get('cover_angles', [])[:3])} | cta: {cta}\n"
            f"      tags: {tags}\n      why: {why}\n      file: {r['file']}")


def show(n, slides_only=False):
    r = next((x for x in DB if x["source"] == "swipe" and x["n"] == n), None)
    if r:
        t = open(os.path.join(ROOT, r["file"]), encoding="utf-8").read()
        if slides_only:
            for i, s in enumerate(r.get("slide_text", []), 1):
                print(f"[{i}] {s}\n")
        else:
            print(t)
        return
    r = next((x for x in DB if x["source"] == "tinna" and x["n"] == n), None)
    if r:
        t = open(os.path.join(ROOT, r["file"]), encoding="utf-8").read()
        m = re.search(rf"(?m)^## POST {n} .*?(?=^## POST \d+ |\Z)", t, re.S)
        print(m.group(0) if m else t)
        return
    print("No post", n)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("query", nargs="?", default="")
    ap.add_argument("-n", type=int, default=8)
    ap.add_argument("--genre")
    ap.add_argument("--angle")
    ap.add_argument("--cta")
    ap.add_argument("--offer")
    ap.add_argument("--tag", action="append")
    ap.add_argument("--min-slides", type=int)
    ap.add_argument("--max-slides", type=int)
    ap.add_argument("--source", choices=["swipe", "tinna"])
    ap.add_argument("--show", type=int)
    ap.add_argument("--slides", type=int)
    ap.add_argument("--list-tags", action="store_true")
    a = ap.parse_args()
    if a.show:
        return show(a.show)
    if a.slides:
        return show(a.slides, True)
    if a.list_tags:
        c = collections.Counter(t for r in DB for t in r.get("tags", []))
        for t, k in c.most_common():
            print(f"{k:4d}  {t}")
        return
    pool = [r for r in DB if not r.get("no_slides")]
    if a.source:
        pool = [r for r in pool if r["source"] == a.source]
    if a.genre:
        pool = [r for r in pool if a.genre.lower() in field(r, "genre")]
    if a.angle:
        pool = [r for r in pool if a.angle.lower() in field(r, "cover_angles")]
    if a.cta:
        pool = [r for r in pool if a.cta.lower() in field(r, "cta_kind")]
    if a.offer:
        pool = [r for r in pool if a.offer.lower() in field(r, "cta_offers")]
    for t in a.tag or []:
        pool = [r for r in pool if t in r.get("tags", [])]
    if a.min_slides:
        pool = [r for r in pool if (r.get("declared_slides") or r.get("slide_count_parsed") or 0) >= a.min_slides]
    if a.max_slides:
        pool = [r for r in pool if (r.get("declared_slides") or r.get("slide_count_parsed") or 99) <= a.max_slides]
    base, ext = toks(a.query)
    if base:
        ranked = sorted(((score(r, base, ext), r) for r in pool), key=lambda x: -x[0])
        ranked = [x for x in ranked if x[0] > 0]
    else:
        ranked = [(0, r) for r in pool]
    print(f"{len(ranked)} matches (showing {min(a.n, len(ranked))})\n")
    for sc, r in ranked[: a.n]:
        print(one_line(r))
        print()


if __name__ == "__main__":
    main()
