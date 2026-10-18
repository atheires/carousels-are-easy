"""Adds one swiped carousel to the library, then rebuilds the index and the numbers.

    python "Scripts/Add Post.py" --title "How to Shoot Your Shot" --account @name --slides 9 --genre Build \
        --copy copy.md --notes notes.md [--caption caption.md] [--source "instagram link or where it came from"]

copy.md   the slide copy exactly as written, one block per slide, in this form:
              **1 — cover**
              text of the cover
              *Short italic description of any image or screenshot.*

              **2**
              text of slide 2
notes.md  why it worked, in bold lead sentences followed by the reasoning (see Reference/Adding Swipe Posts.md)

The post gets the next number, a file in Library/Posts, a row in Library/Original Index.md, and the build runs.
"""
import argparse, os, re, subprocess, sys, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POSTS = os.path.join(ROOT, "Library", "Posts")
IDX = os.path.join(ROOT, "Library", "Original Index.md")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--title", required=True)
    ap.add_argument("--account", default="Unknown")
    ap.add_argument("--slides", type=int, required=True)
    ap.add_argument("--genre", default="Unlabelled", help="Argument, Inventory, Build, Story, Curation, Model or Offer; add a second after ' / ' if it is a hybrid")
    ap.add_argument("--copy", required=True)
    ap.add_argument("--notes", required=True)
    ap.add_argument("--caption")
    ap.add_argument("--source", default="")
    a = ap.parse_args()

    nums = [int(os.path.basename(f).split(" - ")[0]) for f in glob.glob(os.path.join(POSTS, "[0-9]*.md"))]
    n = max(nums) + 1
    title = re.sub(r'[\\/:*?"<>|]', "", a.title).strip()
    name = f"{n:02d} - {title}"
    copy = open(a.copy, encoding="utf-8").read().strip()
    notes = open(a.notes, encoding="utf-8").read().strip()
    out = [f"# {n} — {a.title}", "", f"**Account:** {a.account}", f"**Slides:** {a.slides}"]
    if a.source:
        out.append(f"**Source:** {a.source}")
    out += ["", "---", "", "## Slide copy, verbatim", "", copy, ""]
    if a.caption:
        out += ["---", "", "## Caption, verbatim", "", open(a.caption, encoding="utf-8").read().strip(), ""]
    out += ["---", "", "## Notes", "", notes, ""]
    path = os.path.join(POSTS, name + ".md")
    open(path, "w", encoding="utf-8").write("\n".join(out))

    row = f"| {n:02d} | [[{name}]] | {a.account} | {a.slides} | {a.genre} |"
    idx = open(IDX, encoding="utf-8").read().split("\n")
    last = max((i for i, l in enumerate(idx) if re.match(r"^\| \d+ \| \[\[", l)), default=None)
    if last is None:
        idx += [row]
    else:
        idx.insert(last + 1, row)
    open(IDX, "w", encoding="utf-8").write("\n".join(idx))
    print("Added", path)
    subprocess.run([sys.executable, os.path.join(ROOT, "Scripts", "Build Library.py")], check=True)


if __name__ == "__main__":
    main()
