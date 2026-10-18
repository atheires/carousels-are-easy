"""Rebuilds the library index and the numbers from the swiped posts.

Run after adding or editing any post in Library/Posts:
    python "Scripts/Build Library.py"

Reads   Library/Posts/*.md, Library/Original Index.md, Library/Tinna Loaiza/
Writes  Library/Library Index.json   (one record per post, searched by Search Library.py)
        Reference/Numbers.md         (every measured percentage, regenerated each run)

Every category is detected by pattern from the slide copy, so treat percentages as +/- 5 points.
Hand-labelled facts (genre) come from Library/Original Index.md.
"""
import re, glob, os, json, statistics as st, sys, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POSTS = os.path.join(ROOT, "Library", "Posts")
IDX = os.path.join(ROOT, "Library", "Original Index.md")
TINNA = os.path.join(ROOT, "Library", "Tinna Loaiza")
OUT_JSON = os.path.join(ROOT, "Library", "Library Index.json")
OUT_MD = os.path.join(ROOT, "Reference", "Numbers.md")
SPLIT = 71  # posts 1-71 are the first read, 72+ the later ones

VIS = re.compile(r'photo|screenshot|drawing|illustration|footer|grid|background|handle|logo|font|image|diagram|icon|arrow|colou?r|overlay|mockup|thumbnail|video|frame|stamp|sticker|highlight|crossed|underlin', re.I)
BUL = re.compile(r'^([-•→▪●◦]|\*\s|\d+[.)]\s|[✓✔✅❌➡️🔹•]|[A-Z]\)|\d{2}\s)')
HANDLE = re.compile(r'^@\w+$|^swipe|^follow for|^save this$', re.I)
PROOF = re.compile(r'\$\s?\d|\d[\d,.]*\s?(k|m|%|x|hours?|days?|weeks?|months?|years?|minutes?|mins?|followers|people|views|clients|likes|comments|posts|impressions)\b|\d{1,3}(,\d{3})+', re.I)
EVID = re.compile(r'\d|["“”]|for example|e\.g\.|for instance|because|here\'?s (what|how|the)|proof|screenshot|study|research|according|data\b|result', re.I)
CLAIM = re.compile(r"\b(always|never|most (people|creators|brands)|every(one|body)?|nobody|no one|the (only|real|best|worst|biggest|secret)|guarantee|proven|is (dead|over)|doesn'?t work|will (make|get|change))\b", re.I)


def parse(path):
    t = open(path, encoding="utf-8").read()
    sampled = bool(re.search(r"## Slide copy, verbatim \(sampled\)", t))
    m = re.search(r"## Slide copy[^\n]*\n(.*?)(?=\n---\s*\n|\n## )", t, re.S)
    notes = re.search(r"## Notes[^\n]*\n(.*?)(?=\n## |\Z)", t, re.S)
    if not m:
        return None, sampled, (notes.group(1) if notes else "")
    body = m.group(1)
    body = re.sub(r"(?m)^\*\*(\d+)\*\* . ", lambda k: "**" + k.group(1) + "**" + chr(10), body)
    parts = re.split(r"(?m)^\*\*(\d+)(?:\s*[—-]\s*([^\n*]*?))?\*\*\s*$", body)
    slides = []
    for i in range(1, len(parts), 3):
        slides.append((int(parts[i]), (parts[i + 1] or "").strip(), parts[i + 2]))
    return slides, sampled, (notes.group(1) if notes else "")


def clean(txt):
    out = []
    for l in txt.split("\n"):
        s = l.strip()
        if not s:
            continue
        if re.fullmatch(r"\*[^*].*[^*]\*", s) and (len(s.split()) >= 7 or VIS.search(s)):
            continue
        out.append(s)
    return out


def words(l):
    return len(re.findall(r"[\w'’$%.,-]+", re.sub(r"[*_`]", "", l)))


def is_head(l):
    return bool(re.fullmatch(r"\*\*[^*].*\*\*", l) or re.fullmatch(r"#+ .*", l))


def is_para(l):
    return not BUL.match(l) and (len(l.split()) >= 15 or len(re.findall(r"[.!?](\s|$)", l)) >= 2)


def slide_feats(lines, lab):
    bul = [l for l in lines if BUL.match(l)]
    para = [l for l in lines if is_para(l)]
    heads = [l for l in lines if is_head(l)]
    labelled = bool(lab) and not re.fullmatch(r"(cover|cta|hook|outro|final|last)\b.*", lab, re.I)
    # a short plain line right after a heading, before the body
    sub = False
    if heads:
        i = lines.index(heads[0])
        if i + 1 < len(lines):
            nxt = lines[i + 1]
            sub = (not BUL.match(nxt)) and (not is_head(nxt)) and len(nxt.split()) <= 12 and len(lines) >= 3
    return dict(
        words=sum(words(l) for l in lines), bul=len(bul), bul_w=[words(l) for l in bul],
        para=len(para), para_w=[words(l) for l in para], para_s=[len(re.findall(r"[.!?](\s|$)", l)) or 1 for l in para],
        head=bool(heads) or labelled, head_w=[words(l) for l in heads], sub=sub, lines=len(lines),
        ls=lines, text=" ".join(lines))


NOISE = re.compile(r'^(photo|footer|selfie|screenshot|image|illustration|org chart|each slide|the remaining|>|- )|\u00a9|`|\bMon\b.*\bWed\b|\bFeb\b.*\bMar\b|\u00b7 ?(save|follow)|\b(footer on every|photo of|selfie|screenshot of)\b', re.I)
ANGLES = [  # (name, regex on cover text). A cover can match several; the first is its primary angle.
    ("How I", r"\bhow (i|we)\b"),
    ("How to", r"\bhow to\b|\bhow (do|does|can|you|my)\b|\bsteal my\b|\bthe (exact|simple|easy)\b.*\b(i|you) (use|used)\b"),
    ("Number-led list", r"^\W*(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b\s+\w+|\b\d+\s+(things|ways|levels|ingredients|lessons|rules|steps|videos|truths|tips|mistakes|skills|agents|habits|concepts|formats|exercises|posts|tools|prompts|hacks|signs)\b"),
    ("Named concept / levels", r"\b(levels?|framework|formula|method|ladder|system|mirror|flywheel|blueprint)\b"),
    ("Stop / Never / Don't (command)", r"^\W*(stop|never|don'?t|do not|quit|delete|avoid|ditch)\b"),
    ("Mistake / what's wrong", r"\b(mistakes?|wrong|waste|fail(s|ing)?|worst|trap|lies|brainwashed|ruin)\b"),
    ("Enemy / attack", r"\b(sucks|is dead|is over|is a scam|bros|sheep|slop|fake)\b"),
    ("Why", r"^\W*why\b"),
    ("Question", r"\?"),
    ("Myth / unpopular opinion", r"\b(myth|unpopular opinion|hot take|nobody tells)\b"),
    ("Thought experiment / imagine", r"^\W*(imagine|what if|picture)\b"),
    ("X vs Y", r"\bvs\.?\b|\bversus\b"),
    ("Rule / law", r"\b(rule|law|principle)s?\b"),
    ("Confession / personal story", r"^\W*(i|i'm|i've|i'd|my)\b"),
    ("Reader callout (you)", r"\b(you|your|you're)\b"),
]
LIMIT = re.compile(r"\b(in|under|within|only|just|<)\s*\$?\d+[\w.]*\s*(minutes?|mins?|hours?|days?|weeks?|months?|seconds?|bucks|dollars|/month|a month)\b|\$\d+\s*/\s*(mo|month)|<\s*\d", re.I)


def cover_angles(text):
    l = text.lower()
    hits = [n for n, rx in ANGLES if re.search(rx, l, re.I)]
    return hits or ["Plain claim / topic statement"]


def cta_zone(slides):
    """The comment or DM line, plus the lines around it. Offers and framing are read only from here."""
    ls = [l for s in slides[-3:] for l in s["ls"]]
    out = []
    for i, l in enumerate(ls):
        if re.search(r"\bcomment|\bDM\b|\bdm me\b", l, re.I):
            out += ls[max(0, i - 1): i + 3]
    return " ".join(dict.fromkeys(out)) if out else ""


def cta_info(slides):
    last3 = " ".join(s["text"] for s in slides[-3:])
    t = last3
    zone = (cta_zone(slides) + " " + slides[-1]["text"]).strip()
    kind = "No CTA"
    if re.search(r"\bcomment", t, re.I):
        kind = "Comment a word"
    elif re.search(r"\bDM\b|\bdm me\b|message me", t):
        kind = "DM a word"
    elif re.search(r"send (it )?to|email|pitch|apply|waitlist|\bbook\b|link in bio|sign up", t, re.I):
        kind = "Apply / email / book / link"
    elif re.search(r"\bfollow\b", t, re.I):
        kind = "Follow only"
    elif re.search(r"\bsave\b|\bshare\b", t, re.I):
        kind = "Save / share only"
    m = re.search(r'(?:comment|dm me|dm)\W{0,6}["\u201c\u2018\']?\s*([A-Za-z0-9 ]{2,20}?)\s*["\u201d\u2019\']', t, re.I)
    if not m:
        m = re.search(r"\b(?:comment|dm)\b\W{0,4}(?:the word\s+|with\s+|me\s+)?[\"\u201c\u2018']?([A-Z][A-Z0-9]{2,})\b", t)
    if not m:
        m = re.search(r"\b(?:comment|dm me|dm)\b\W{0,4}(?!how\b|under\b|email\b|below\b|your\b|the\b|a\b|if\b|on\b|and\b|me\b|with\b|any\b|one\b|\w+ing\b)(\w{3,})", t, re.I)
    word = m.group(1).strip() if m else None
    offers = []
    for lab, rx in [("video / course / workshop", r"video|course|workshop|masterclass|tutorial|webinar|lesson|recording"),
                    ("guide / playbook / doc / framework", r"guide|playbook|\bdoc\b|document|system|blueprint|framework|breakdown|process|roadmap"),
                    ("prompts", r"prompt"),
                    ("template / sheet / list / link", r"template|checklist|cheat|\blist\b|\blink\b|pdf|\bfile\b|hooks|swipe|sheet"),
                    ("tool / dashboard / skill", r"dashboard|skill|installer|\bapp\b|plugin|extension"),
                    ("paid offer / cohort / spot", r"\$\d|€\d|cohort|\bspots?\b|1:1|program|apply|waitlist|\bjoin\b|coaching")]:
        if re.search(rx, zone, re.I):
            offers.append(lab)
    framing = []
    for lab, rx in [("scarcity or deadline", r"\bspots?\b|only \d+|limited|deadline|until|before (the )?\w+ \d|by (monday|friday|\w+ \d)|once they'?re gone|\bdays? left"),
                    ("free", r"\bfree\b"),
                    ("follow first so it lands", r"follow (me )?(first|so)|so (my|the) (message|dm)"),
                    ("names the deliverable and its form", r"\d+\+?\s*(min|page|prompt|hook|template|video|step)s?|full (video|guide|prompt|breakdown)|brand new|step-by-step|\bpdf\b|checklist"),
                    ("benefit in the reader's life", r"so (you|that you) can|you('ll| will| can)|lets you|without having to|never again|stop having to")]:
        if re.search(rx, zone, re.I):
            framing.append(lab)
    return kind, word, offers, framing


def tags_for(slides, cover, notes, kind, word):
    T = " ".join(s["text"] for s in slides)
    tags = []
    chk = [
        ("proof-early", any(PROOF.search(s["text"]) for s in slides[:3])),
        ("proof-numbers", len(PROOF.findall(T)) >= 1),
        ("reader-quoted-back", bool(re.search(r"[“\"][^”\"]{8,}[”\"]", T))),
        ("named-framework", bool(re.search(r"\b(framework|formula|method|ladder|levels?|flywheel|blueprint)\b", T, re.I))),
        ("before-after", bool(re.search(r"\bused to\b|before.{0,30}after|then.{0,30}now|instead of|from .{0,25} to ", T, re.I))),
        ("self-correction", bool(re.search(r"i was wrong|i'?m no |no expert|i used to be|i'?m lacking|my mistake|i failed|i messed|i got it wrong|honestly|i didn'?t know|i thought", T, re.I))),
        ("permission", bool(re.search(r"you don'?t need|no need to|you can start|even if|doesn'?t have to be", T, re.I))),
        ("objection-answered", bool(re.search(r"but what if|what about|you might be thinking|you'?re probably thinking|i know what you|but (here'?s|wait)|\bbut\b.{0,40}\?", T, re.I))),
        ("worked-example", bool(re.search(r"for example|for instance|here'?s (an|one) example|example:", T, re.I))),
        ("script-or-prompt-shown", bool(re.search(r"prompt:|\bscript\b|\bsubject line\b|\bdm:|the exact (words|prompt|message)", T, re.I))),
        ("forward-links", sum(bool(re.search(r"→|\.\.\.|…|here'?s|but first|now ", s["text"][-60:], re.I)) for s in slides) >= 2),
        ("recap-slide", bool(re.search(r"recap|in short|to sum|the whole thing|bottom line|remember", " ".join(s["text"] for s in slides[-3:]), re.I))),
        ("loose-voice", bool(re.search(r"\bsh[i*]t\b|f\*+|f[u*]ck|\blmao\b|\blol\b|\bomg\b|\btbh\b|\bngl\b|\bdamn\b|\bmfers?\b|\bwtf\b|\bcrap\b|\bbs\b|\bsucks?\b|\bgonna\b|\bkinda\b|\bbro(s)?\b|\bhell\b|\bass\b", T, re.I))),
        ("all-lowercase", len(T) > 100 and sum(c.isupper() for c in T) / max(1, sum(c.isalpha() for c in T)) < 0.02),
        ("emoji", bool(re.search(r"[\U0001F300-\U0001FAFF☀-➿]", T))),
        ("cover-has-limit-or-credential", bool(LIMIT.search(cover)) or bool(re.search(r"\$\s?\d|\d+k\b|\d+x\b|\d+ (hours|days|weeks|months|years)", cover, re.I))),
        ("cover-has-number", bool(re.search(r"\d", cover))),
        ("keyword-cta", kind in ("Comment a word", "DM a word") and bool(word)),
    ]
    for name, ok in chk:
        if ok:
            tags.append(name)
    return tags


def why(notes):
    """First lead sentences from the Notes section, i.e. why the post worked."""
    leads = re.findall(r"\*\*(.+?)\*\*", notes)
    leads = [x for x in leads if len(x.split()) >= 4]
    return " | ".join(leads[:3]) if leads else re.sub(r"\s+", " ", notes)[:300]


def load_index():
    meta = {}
    if os.path.exists(IDX):
        for m in re.finditer(r"^\| (\d+) \| \[\[(.*?)\]\] \| (.*?) \| (\d+) \| (.*?) \|\s*$", open(IDX, encoding="utf-8").read(), re.M):
            meta[int(m.group(1))] = dict(account=m.group(3).strip(), slides=int(m.group(4)), genre=m.group(5).strip())
    return meta


def build():
    meta = load_index()
    recs = []
    for f in sorted(glob.glob(os.path.join(POSTS, "[0-9]*.md"))):
        base = os.path.basename(f)
        n = int(base.split(" - ")[0])
        title = base[:-3].split(" - ", 1)[1] if " - " in base else base[:-3]
        slides, sampled, notes = parse(f)
        r = dict(n=n, file="Library/Posts/" + base, title=title, source="swipe", sampled=sampled, notes=notes)
        mm = meta.get(n, {})
        r["account"] = mm.get("account", "Unknown")
        r["genre"] = mm.get("genre", "Unlabelled")
        r["declared_slides"] = mm.get("slides")
        if not slides:
            r["no_slides"] = True
            recs.append(r)
            continue
        S = []
        for num, lab, txt in slides:
            ls = clean(txt)
            if not ls and not lab:
                continue
            d = slide_feats(ls, lab)
            d["n"] = num
            d["lab"] = lab
            S.append(d)
        if not S:
            r["no_slides"] = True
            recs.append(r)
            continue
        cover_lines = [l for l in clean(slides[0][2]) if not HANDLE.match(l) and not NOISE.search(l) and len(l.split()) <= 22]
        cover = " ".join(re.sub(r"[*_]", "", l) for l in cover_lines)
        segs = [x.strip() for x in re.split(r"(?<=[.?!:→])\s+|\s+(?=\()", cover) if re.search(r"\w", x)]
        r["cover_head"] = segs[0] if segs else cover
        r["cover_sub"] = " ".join(segs[1:])
        r["cover"] = cover
        r["cover_lines"] = [re.sub(r"[*_]", "", l) for l in cover_lines]
        r["cover_angles"] = cover_angles(cover)
        r["slides"] = S
        kind, word, offers, framing = cta_info(S)
        r["cta_kind"], r["cta_word"], r["cta_offers"], r["cta_framing"] = kind, word, offers, framing
        r["cta_text"] = " ".join(s["text"] for s in S[-2:])[:400]
        r["tags"] = tags_for(S, cover, notes, kind, word)
        r["why"] = why(notes)
        r["words_body_avg"] = round(st.mean([s["words"] for s in S[1:-1]]), 1) if len(S) > 2 else None
        recs.append(r)
    return recs


# ---------------------------------------------------------------- numbers
def pct(a, b):
    return f"{round(100 * a / b)}%" if b else "n/a"


def mean(x):
    return round(st.mean(x), 1) if x else 0


def groups(recs):
    ok = [r for r in recs if not r.get("no_slides")]
    full = [r for r in ok if not r["sampled"]]  # sampled posts keep only some slides, so they never feed per-slide averages
    return {
        "1-71": [r for r in full if r["n"] <= SPLIT],
        f"72-{max(r['n'] for r in recs)}": [r for r in full if r["n"] > SPLIT],
        "All": full,
    }, ok


def table(title, header, rows, note=None):
    out = [f"### {title}", "", "| " + " | ".join(header) + " |", "|" + "---|" * len(header)]
    for r in rows:
        out.append("| " + " | ".join(str(c) for c in r) + " |")
    if note:
        out += ["", note]
    return "\n".join(out) + "\n"


def numbers(recs):
    G, ok = groups(recs)
    names = list(G)
    L = []
    P = lambda f, rs: pct(sum(1 for r in rs if f(r)), len(rs))
    body = lambda r: r["slides"][1:-1] if len(r["slides"]) > 2 else r["slides"]
    allbody = lambda rs: [s for r in rs for s in body(r)]

    def row(label, fn):
        return [label] + [fn(rs) for rs in G.values()]

    L.append("# Numbers\n")
    L.append(f"*Generated by `Scripts/Build Library.py` on {datetime.date.today().isoformat()}. Do not edit by hand; add posts to the library and rebuild.*\n")
    L.append(f"**Sample.** {len(recs)} swiped posts. {len(ok)} had slide copy that parsed; {len(ok) - len(G['All'])} of those are sampled-only posts that keep just a few slides, so they are left out of every per-slide figure and counted only for slide count, cover, CTA and tags. Columns: posts 1-71 (the first read), later posts, and all.\n")
    L.append("**How to read these.** Every figure came from a script reading the slide copy, so treat it as +/-5 points. Cover angle, CTA kind and offer, device tags and headings are pattern-detected, not hand-labelled. Genre is hand-labelled in `Library/Original Index.md`. A number says what winners did on average. It never says what the current idea needs. **If a number and the idea disagree, the idea wins.** Never use any figure as a quota.\n")
    L.append("Sample sizes: " + ", ".join(f"{k} = {len(v)} posts" for k, v in G.items()) + ".\n")

    # 1 genre
    gl = lambda r: re.split(r" / |/", r["genre"])[0].replace("⚠", "").strip()
    labs = ["Argument", "Inventory", "Build", "Story", "Curation", "Model", "Offer"]
    L.append("## 1. What kind of post it is\n")
    allr = {k: [r for r in ok if (r["n"] <= SPLIT if k == "1-71" else (r["n"] > SPLIT if k != "All" else True))] for k in names}
    rowsg = [[lab] + [pct(sum(gl(r) == lab or (lab == "Offer" and "Offer" in r["genre"]) for r in rs), len(rs)) for rs in allr.values()] for lab in labs]
    rowsg.append(["Other / unlabelled"] + [pct(sum(gl(r) not in labs for r in rs), len(rs)) for rs in allr.values()])
    L.append(table("Genre (first label in the original index; counts every parsed post)", ["Genre"] + names, rowsg))

    # 2 slide count
    L.append("## 2. Slides per post\n")
    sc = lambda rs: [r["declared_slides"] or len(r["slides"]) for r in rs]
    cnt = {k: sc(rs) for k, rs in allr.items()}
    rows = [["Average"] + [mean(v) for v in cnt.values()], ["Median"] + [st.median(v) for v in cnt.values()]]
    for lab, lo, hi in [("6 or fewer", 0, 6), ("7-9", 7, 9), ("10-12", 10, 12), ("13 or more", 13, 99)]:
        rows.append([lab] + [pct(sum(lo <= x <= hi for x in v), len(v)) for v in cnt.values()])
    modes = {k: st.mode(v) for k, v in cnt.items()}
    rows.append(["Most common count"] + [modes[k] for k in names])
    L.append(table("Declared slide count (from the index)", ["Metric"] + names, rows))

    # 3 words per slide
    L.append("## 3. Words per slide\n")
    rows = [row("Average words, body slides", lambda rs: mean([s["words"] for s in allbody(rs)])),
            row("Median words, body slides", lambda rs: st.median([s["words"] for s in allbody(rs)])),
            row("Cover, average words", lambda rs: mean([r["slides"][0]["words"] for r in rs])),
            row("Slide 2, average words", lambda rs: mean([r["slides"][1]["words"] for r in rs if len(r["slides"]) > 1])),
            row("Last slide, average words", lambda rs: mean([r["slides"][-1]["words"] for r in rs]))]
    for lab, lo, hi in [("Slides of 15 words or fewer", -1, 15), ("16-35 words", 15, 35), ("36-60 words", 35, 60), ("61-100 words", 60, 100), ("Over 100 words", 100, 9999)]:
        rows.append(row(lab, lambda rs, lo=lo, hi=hi: pct(sum(lo < s["words"] <= hi for s in allbody(rs)), len(allbody(rs)))))
    pa = lambda rs: [mean([s["words"] for s in body(r)]) for r in rs]
    rows.append(row("Posts averaging 20 or fewer words a slide", lambda rs: pct(sum(x <= 20 for x in pa(rs)), len(rs))))
    rows.append(row("Posts averaging 21-40", lambda rs: pct(sum(20 < x <= 40 for x in pa(rs)), len(rs))))
    rows.append(row("Posts averaging 41-60", lambda rs: pct(sum(40 < x <= 60 for x in pa(rs)), len(rs))))
    rows.append(row("Posts averaging over 60", lambda rs: pct(sum(x > 60 for x in pa(rs)), len(rs))))
    L.append(table("Words", ["Metric"] + names, rows))

    # 4 formatting
    L.append("## 4. Formatting\n")
    rows = [row("Slides with a paragraph (a line of 15+ words or 2+ sentences)", lambda rs: pct(sum(s["para"] > 0 for s in allbody(rs)), len(allbody(rs)))),
            row("Slides with bullets", lambda rs: pct(sum(s["bul"] > 0 for s in allbody(rs)), len(allbody(rs)))),
            row("Slides with a bold heading or a label (01, Step 2, Level 3)", lambda rs: pct(sum(s["head"] for s in allbody(rs)), len(allbody(rs)))),
            row("Slides with a heading and a short line under it (subheadline)", lambda rs: pct(sum(s["sub"] for s in allbody(rs)), len(allbody(rs)))),
            row("Short lines only (no paragraph, no bullets)", lambda rs: pct(sum(s["para"] == 0 and s["bul"] == 0 for s in allbody(rs)), len(allbody(rs)))),
            row("Single-line slides", lambda rs: pct(sum(s["lines"] == 1 for s in allbody(rs)), len(allbody(rs))))]
    L.append(table("Share of body slides", ["Element"] + names, rows))
    ps = lambda rs: [w for s in allbody(rs) for w in s["para_w"]]
    bw = lambda rs: [w for s in allbody(rs) for w in s["bul_w"]]
    hw = lambda rs: [w for s in allbody(rs) for w in s["head_w"]]
    bs = lambda rs: [s["bul"] for s in allbody(rs) if s["bul"]]
    rows = [row("Average words in a paragraph line", lambda rs: mean(ps(rs))),
            row("Median words in a paragraph line", lambda rs: st.median(ps(rs))),
            row("Average sentences in a paragraph line", lambda rs: mean([x for s in allbody(rs) for x in s["para_s"]])),
            row("Average words in a bullet", lambda rs: mean(bw(rs))),
            row("Bullets under 8 words", lambda rs: pct(sum(w < 8 for w in bw(rs)), len(bw(rs)))),
            row("Average bullets on a bullet slide", lambda rs: mean(bs(rs))),
            row("Bullet slides with 3-5 bullets", lambda rs: pct(sum(3 <= x <= 5 for x in bs(rs)), len(bs(rs)))),
            row("Average words in a bold heading", lambda rs: mean(hw(rs))),
            row("Median words in a bold heading", lambda rs: st.median(hw(rs)))]
    L.append(table("Sizes", ["Metric"] + names, rows))
    rows = [row("Posts with paragraphs on at least half the slides", lambda rs: pct(sum(sum(1 for s in body(r) if s["para"]) / max(1, len(body(r))) >= .5 for r in rs), len(rs))),
            row("Posts with bullets on 40%+ of slides", lambda rs: pct(sum(sum(1 for s in body(r) if s["bul"]) / max(1, len(body(r))) >= .4 for r in rs), len(rs))),
            row("Posts with headings on at least half the slides", lambda rs: pct(sum(sum(1 for s in body(r) if s["head"]) / max(1, len(body(r))) >= .5 for r in rs), len(rs))),
            row("Posts with no headings or labels anywhere", lambda rs: pct(sum(not any(s["head"] for s in body(r)) for r in rs), len(rs))),
            row("Posts that number or label slides (01, Step 2, Level 3, #4)", lambda rs: pct(sum(sum(bool(re.match(r"^\W*(\d{1,2}[.)/:]|0\d\b|step \d|#\d|level \d|day \d|part \d|problem \d|rule \d)", s["text"].strip(), re.I)) for s in r["slides"]) >= 3 for r in rs), len(rs)))]
    L.append(table("By post", ["Measure"] + names, rows))

    def pos_rows(fn, label):
        out = []
        for lab, sel in [("Slide 2", lambda S: S[1:2]), ("Middle slides", lambda S: S[2:-1]), ("Second to last", lambda S: S[-2:-1]), ("Last slide", lambda S: S[-1:])]:
            out.append([f"{label}: {lab}"] + [pct(sum(fn(s) for r in rs for s in sel(r["slides"])), sum(len(sel(r["slides"])) for r in rs)) for rs in G.values()])
        return out
    L.append(table("Where headings and bullets sit", ["Position"] + names, pos_rows(lambda s: s["head"], "heading") + pos_rows(lambda s: s["bul"] > 0, "bullets") + pos_rows(lambda s: s["para"] > 0, "paragraph")))

    # 5 covers
    L.append("## 5. Covers\n")
    covw = lambda r: len(r["cover"].split())
    first = lambda r: len(r["cover_head"].split())
    rest = lambda r: len(r["cover_sub"].split())
    cov_all = {k: [r for r in rs if covw(r) <= 40] for k, rs in allr.items()}
    rows = [["Average words on the cover"] + [mean([covw(r) for r in rs]) for rs in cov_all.values()],
            ["Median words on the cover"] + [st.median([covw(r) for r in rs]) for rs in cov_all.values()],
            ["Covers of 10 words or fewer"] + [pct(sum(covw(r) <= 10 for r in rs), len(rs)) for rs in cov_all.values()],
            ["Covers of 11-20 words"] + [pct(sum(10 < covw(r) <= 20 for r in rs), len(rs)) for rs in cov_all.values()],
            ["Covers of 21-40 words"] + [pct(sum(20 < covw(r) <= 40 for r in rs), len(rs)) for rs in cov_all.values()],
            ["Average words in the main headline (first sentence or phrase)"] + [mean([first(r) for r in rs]) for rs in cov_all.values()],
            ["Median words in the main headline"] + [st.median([first(r) for r in rs]) for rs in cov_all.values()],
            ["Covers with a subheadline (anything after the first sentence)"] + [pct(sum(bool(r["cover_sub"]) for r in rs), len(rs)) for rs in cov_all.values()],
            ["Average words in the subheadline, when present"] + [mean([rest(r) for r in rs if r["cover_sub"]]) for rs in cov_all.values()],
            ["Cover contains a digit"] + [pct(sum(bool(re.search(r"\d", r["cover"])) for r in rs), len(rs)) for rs in cov_all.values()],
            ["Cover has a limit or credential ($64/month, 1000 hours, <3 minutes)"] + [pct(sum("cover-has-limit-or-credential" in r["tags"] for r in rs), len(rs)) for rs in cov_all.values()],
            ["Cover contains a parenthesis"] + [pct(sum("(" in r["cover"] for r in rs), len(rs)) for rs in cov_all.values()],
            ["Cover is all lowercase"] + [pct(sum(r["cover"] == r["cover"].lower() and len(r["cover"]) > 10 for r in rs), len(rs)) for rs in cov_all.values()]]
    L.append(table("Cover size and shape", ["Metric"] + names, rows, "The copy carries no typography, so the main headline is read as the first sentence or phrase and the subheadline as everything after it. Image descriptions, handles and covers over 40 words (post 43 is a story) are left out."))
    angle_names = [a for a, _ in ANGLES] + ["Plain claim / topic statement"]
    rows = [[a] + [pct(sum(r["cover_angles"][0] == a for r in rs), len(rs)) for rs in cov_all.values()] for a in angle_names]
    L.append(table("Cover angle, primary (first pattern that matches, in the table's order)", ["Angle"] + names, rows))
    rows = [[a] + [pct(sum(a in r["cover_angles"] for r in rs), len(rs)) for rs in cov_all.values()] for a in angle_names]
    L.append(table("Cover angle, any match (a cover can sit in several)", ["Angle"] + names, rows, "Angles follow the vault's cover angle groups. Pattern-detected, so a clever cover that matches no pattern lands in plain claim."))

    # 6 CTA
    L.append("## 6. Call to action (read from the last three slides)\n")
    kinds = ["Comment a word", "DM a word", "Apply / email / book / link", "Follow only", "Save / share only", "No CTA"]
    rows = [[k] + [pct(sum(r["cta_kind"] == k for r in rs), len(rs)) for rs in cov_all.values()] for k in kinds]
    L.append(table("Primary CTA", ["CTA"] + names, rows))
    kwp = {k: [r for r in rs if r["cta_kind"] in ("Comment a word", "DM a word")] for k, rs in cov_all.items()}
    offs = ["video / course / workshop", "guide / playbook / doc / framework", "prompts", "template / sheet / list / link", "tool / dashboard / skill", "paid offer / cohort / spot"]
    rows = [[o] + [pct(sum(o in r["cta_offers"] for r in rs), len(rs)) for rs in kwp.values()] for o in offs]
    L.append(table("What a comment or DM CTA hands over (a CTA can name several)", ["Offer"] + names, rows))
    frs = ["names the deliverable and its form", "benefit in the reader's life", "free", "scarcity or deadline", "follow first so it lands"]
    rows = [[f] + [pct(sum(f in r["cta_framing"] for r in rs), len(rs)) for rs in kwp.values()] for f in frs]
    L.append(table("How the CTA is framed (among comment or DM CTAs)", ["Framing"] + names, rows))
    kws = {k: [r["cta_word"] for r in rs if r["cta_word"]] for k, rs in kwp.items()}
    rows = [["Posts where the keyword was found"] + [len(v) for v in kws.values()],
            ["Single word"] + [pct(sum(" " not in w for w in v), len(v)) for v in kws.values()],
            ["Written in capitals"] + [pct(sum(w.isupper() for w in v), len(v)) for v in kws.values()],
            ["Average letters"] + [mean([len(w) for w in v]) for v in kws.values()]]
    L.append(table("The comment word itself", ["Metric"] + names, rows))
    cslide = lambda r: len(r["slides"])
    rows = [["CTA sits on the last slide"] + [pct(sum(bool(re.search(r"comment|\bdm\b", r["slides"][-1]["text"], re.I)) for r in rs), len(rs)) for rs in kwp.values()],
            ["CTA also appears before the last slide"] + [pct(sum(any(re.search(r"comment|\bdm\b", s["text"], re.I) for s in r["slides"][:-1]) for r in rs), len(rs)) for rs in kwp.values()]]
    L.append(table("CTA position (among comment or DM CTAs)", ["Metric"] + names, rows))

    # 7 voice
    L.append("## 7. Voice and writing\n")
    allsl = lambda rs: [s for r in rs for s in r["slides"]]
    sent = lambda t: [x for x in re.split(r"(?<=[.!?…])\s+", t) if re.search(r"\w", x)]
    sl_ = lambda rs: [len(x.split()) for s in allsl(rs) for x in sent(s["text"])]
    rows = [row("Slides addressing 'you'", lambda rs: pct(sum(bool(re.search(r"\b(you|your|you're|you'll)\b", s["text"], re.I)) for s in allsl(rs)), len(allsl(rs)))),
            row("Slides using I / my / we", lambda rs: pct(sum(bool(re.search(r"\b(i|i'm|i've|i'd|my|me|we|our)\b", s["text"], re.I)) for s in allsl(rs)), len(allsl(rs)))),
            row("Slides with negation or contrast (not, don't, stop, never, instead, but)", lambda rs: pct(sum(bool(re.search(r"\b(not|isn't|aren't|don't|doesn't|stop|never|instead|no longer|without|wrong|but)\b", s["text"], re.I)) for s in allsl(rs)), len(allsl(rs)))),
            row("Slides containing a number", lambda rs: pct(sum(bool(re.search(r"\d", s["text"])) for s in allsl(rs)), len(allsl(rs)))),
            row("Slides containing a question", lambda rs: pct(sum("?" in s["text"] for s in allsl(rs)), len(allsl(rs)))),
            row("Sentences of 8 words or fewer", lambda rs: pct(sum(x <= 8 for x in sl_(rs)), len(sl_(rs)))),
            row("Average words per sentence", lambda rs: mean(sl_(rs)))]
    L.append(table("Per slide", ["Measure"] + names, rows))
    rows = [[lab, *[pct(sum(tag in r["tags"] for r in rs), len(rs)) for rs in cov_all.values()]] for lab, tag in [
        ("Quotes the reader or an enemy line back", "reader-quoted-back"), ("A proof figure appears anywhere ($, K, M, %, hours, counts)", "proof-numbers"),
        ("Proof number on the cover, slide 2 or 3", "proof-early"), ("A named framework, system, ladder or formula", "named-framework"),
        ("A before-and-after or then-and-now contrast", "before-after"), ("A self-correction or admission", "self-correction"),
        ("A permission line (you don't need, even if)", "permission"), ("An objection raised and answered", "objection-answered"),
        ("A script or prompt shown", "script-or-prompt-shown"),
        ("Forward links on two or more slides", "forward-links"), ("A recap or summary in the last three slides", "recap-slide"),
        ("Casual slang or swearing (sucks, gonna, lol, sh*t, bro)", "loose-voice"), ("Written wholly in lowercase", "all-lowercase"), ("Uses emoji", "emoji")]]
    L.append(table("Per post (share of posts)", ["Device"] + names, rows, "Self-correction, objection-answered and script-shown are matched on fixed phrases, so they undercount. The Tinna Loaiza data finds one self-undercut in almost every post, which a phrase match cannot see."))

    # 8 proof rule
    L.append("## 8. Claims and proof\n")
    def claim_followed(rs):
        a = b = 0
        for r in rs:
            S = r["slides"]
            for i, s in enumerate(S):
                if i == 0 or not CLAIM.search(s["text"]):
                    continue
                a += 1
                nxt = S[i + 1]["text"] if i + 1 < len(S) else ""
                if EVID.search(s["text"] + " " + nxt):
                    b += 1
        return pct(b, a), a
    rows = [["Claim slides followed or backed within one slide by a number, quote, example or reason"] + [claim_followed(rs)[0] for rs in G.values()],
            ["Claim slides counted"] + [claim_followed(rs)[1] for rs in G.values()],
            ["Body slides that carry evidence (digit, quote, example, because)"] + [pct(sum(bool(EVID.search(s["text"])) for s in allbody(rs)), len(allbody(rs))) for rs in G.values()],
            ["Posts with a proof number by slide 3"] + [pct(sum("proof-early" in r["tags"] for r in rs), len(rs)) for rs in G.values()]]
    L.append(table("How often a claim is backed straight away", ["Measure"] + names, rows, "A claim cue is a strong word (always, never, most people, nobody, the only, guarantee). Evidence is anything checkable on the same or next slide. This is a rough floor: borrowed proof, analogies and logic carry no digits, so the real rate is higher. See Reference/Rules.md R3."))

    # 9 position of proof etc
    L.append("## 9. Sampled posts\n")
    L.append("Posts with only a few slides kept, excluded from the per-slide figures: " + ", ".join(f"{r['n']:02d}" for r in ok if r["sampled"]) + ".\n")
    missing = [r["n"] for r in recs if r.get("no_slides")]
    if missing:
        L.append("Posts with no parseable slide copy, left out of everything: " + ", ".join(f"{n:02d}" for n in missing) + ".\n")
    return "\n".join(L)


def tinna():
    syn = os.path.join(TINNA, "00 - DNA Synthesis.md")
    out = []
    if not os.path.exists(syn):
        return out
    t = open(syn, encoding="utf-8").read()
    for m in re.finditer(r"^\| (\d+) \| (.*?) \| ([\d,]+) \| ([\d,]+) \| ([\d.]+)% \| (.*?) \|\s*$", t, re.M):
        n = int(m.group(1))
        f = "Library/Tinna Loaiza/" + ("Posts 01-04.md" if n <= 4 else "Posts 05-08.md" if n <= 8 else f"Post {n:02d}.md")
        out.append(dict(n=n, source="tinna", title=m.group(2), likes=int(m.group(3).replace(",", "")), comments=int(m.group(4).replace(",", "")),
                        ratio=float(m.group(5)), cta=m.group(6), file=f, genre="Tinna Loaiza", account="@tinnaloaizaofficial",
                        tags=["measured-comment-rate"], why=m.group(2) + " | " + m.group(6)))
    return out


if __name__ == "__main__":
    recs = build()
    md = numbers(recs)
    os.makedirs(os.path.dirname(OUT_MD), exist_ok=True)
    open(OUT_MD, "w", encoding="utf-8").write(md)
    slim = []
    for r in recs:
        d = {k: v for k, v in r.items() if k not in ("slides",)}
        if "slides" in r:
            d["slide_count_parsed"] = len(r["slides"])
            d["slide_text"] = [s["text"] for s in r["slides"]]
        slim.append(d)
    slim += tinna()
    json.dump(slim, open(OUT_JSON, "w", encoding="utf-8"), ensure_ascii=False)
    print(f"{len(recs)} swiped posts, {len([r for r in recs if not r.get('no_slides')])} parsed, {len(tinna())} Tinna posts -> {os.path.relpath(OUT_JSON, ROOT)}, {os.path.relpath(OUT_MD, ROOT)}")
