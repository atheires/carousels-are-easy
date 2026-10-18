#!/usr/bin/env python3
"""Generate or edit an image through Codex's built-in image tool (ChatGPT login, no API key).

Usage:
  python codex_image.py -p "PROMPT" [-f out.png] [-i ref.png ...] [--size portrait]

Runs `codex exec --json` once, asks it to use its native image_generation tool, then copies
the image(s) from this call's own ~/.codex/generated_images/<thread id>/ folder to the output path.
One call per image: each codex exec costs ~7k tokens of overhead against the ChatGPT limit.
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path

GEN_DIR = Path.home() / ".codex" / "generated_images"
SIZES = {
    "square": "square 1:1", "1k": "square 1:1", "portrait": "portrait 2:3",
    "tall": "tall vertical 9:16", "landscape": "landscape 3:2", "wide": "wide 16:9",
    "4:5": "vertical portrait 4:5 (1080x1350), taller than wide",
}


IMAGE_EXTS = {".png", ".webp", ".jpg", ".jpeg"}


def snapshot() -> set[Path]:
    return set(GEN_DIR.rglob("*.png")) | set(GEN_DIR.rglob("*.webp")) | set(GEN_DIR.rglob("*.jpg")) if GEN_DIR.exists() else set()


def session_id(jsonl: str) -> str | None:
    """The thread id from `codex exec --json` output; it names this call's generated_images folder."""
    for line in jsonl.splitlines():
        try:
            ev = json.loads(line)
        except ValueError:
            continue
        if not isinstance(ev, dict):
            continue
        thread = ev.get("thread_id") or (ev.get("msg") or {}).get("thread_id")
        if thread and re.fullmatch(r"[0-9A-Za-z-]+", str(thread)):
            return str(thread)
    return None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("-p", "--prompt", required=True)
    ap.add_argument("-f", "--file", default=None)
    ap.add_argument("-i", "--image", action="append", default=[])
    ap.add_argument("--size", default=None)
    ap.add_argument("--model", default="gpt-5.6-luna", help="Codex chat model driving the tool call")
    ap.add_argument("--timeout", type=int, default=600)
    a = ap.parse_args()

    for ref in a.image:
        if not Path(ref).is_file():
            print(f"error: reference not found: {ref}", file=sys.stderr)
            return 2

    size = f" Aspect ratio: {SIZES.get(a.size, a.size)}." if a.size else ""
    mode = "Edit the attached reference image(s) as described." if a.image else "Generate one image."
    instruction = (
        f"{mode} Use your built-in image generation tool exactly once. "
        "Pass the prompt below verbatim; do not rewrite it, write code, or create files yourself.{size}\n\n"
        f"PROMPT:\n{'Image aspect ratio: ' + SIZES.get(a.size, a.size) + '. ' if a.size else ''}{a.prompt}"
    ).replace("{size}", size)

    codex = shutil.which("codex") or shutil.which("codex.cmd")
    if not codex:
        print("error: codex CLI not found on PATH", file=sys.stderr)
        return 2
    cmd = [codex, "exec", "--json", "--skip-git-repo-check", "-m", a.model,
           "-c", 'model_reasoning_effort="low"']
    for ref in a.image:
        cmd += ["-i", str(Path(ref).resolve())]
    cmd.append("-")

    before = snapshot()
    start = time.time()
    proc = subprocess.run(cmd, input=instruction, text=True, capture_output=True,
                          timeout=a.timeout, encoding="utf-8", errors="replace")

    # Codex saves each session's images in generated_images/<thread id>/. Read only our own
    # folder: other Codex jobs running at the same time write into the same parent directory.
    thread = session_id(proc.stdout or "")
    if thread:
        folder = GEN_DIR / thread
        new = sorted((p for p in folder.glob("*.*") if p.suffix.lower() in IMAGE_EXTS),
                     key=lambda p: p.stat().st_mtime) if folder.is_dir() else []
    else:
        # No thread id in the output (format changed?). Only trust the directory diff when it is
        # unambiguous; with several new images we cannot tell ours from another job's.
        new = sorted((p for p in snapshot() - before if p.stat().st_mtime >= start - 5),
                     key=lambda p: p.stat().st_mtime)
        if len(new) > 1:
            print("error: no Codex thread id found and several new images appeared, "
                  "so they may belong to other Codex jobs. Nothing was copied:", file=sys.stderr)
            for p in new:
                print(f"  {p}", file=sys.stderr)
            return 1
    if not new:
        print(f"error: codex produced no image (thread {thread}).", file=sys.stderr)
        print((proc.stdout or "")[-2000:], (proc.stderr or "")[-2000:], sep="\n", file=sys.stderr)
        return 1

    out = Path(a.file) if a.file else Path.home() / "Documents" / "GPT Image Dashboard" / f"Image {time.strftime('%H%M%S')}.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    # Newest image goes to the exact requested path; if Codex made more than one, keep the rest beside it.
    ordered = [new[-1]] + new[:-1]
    if len(ordered) > 1:
        print(f"warning: codex made {len(ordered)} images in one call; the newest is at {out.name}.", file=sys.stderr)
    saved = []
    for n, src in enumerate(ordered):
        dst = out if n == 0 else out.with_name(f"{out.stem} {n + 1}{out.suffix}")
        shutil.copy2(src, dst)
        saved.append(dst)
    for s in saved:
        print(s.resolve())
    return 0


if __name__ == "__main__":
    sys.exit(main())
