# Carousels Are Easy

Turn a brain dump into a finished Instagram or LinkedIn carousel: written copy first, then designed slides in your own brand kit.

It runs on your own computer and uses **your own Claude and ChatGPT subscriptions**. No API keys, no API credits. Claude writes, ChatGPT (through Codex) designs.

## What you need

| Thing | Why | Get it |
|---|---|---|
| Node.js 20 or newer | Runs the app | [nodejs.org](https://nodejs.org) |
| Python 3 | The writer searches its swipe library with a small script | [python.org](https://www.python.org/downloads/) |
| A Claude Pro or Max plan | Writing | [claude.ai](https://claude.ai) |
| A ChatGPT Plus or Pro plan | Design and images | [chatgpt.com](https://chatgpt.com) |
| Claude Code | The app talks to Claude through it | `npm install -g @anthropic-ai/claude-code` |
| Codex | The app talks to ChatGPT through it | `npm install -g @openai/codex` |
| gallery-dl and ffmpeg (optional) | Downloading an Instagram account's posts when you add an account | `pip install gallery-dl`, [ffmpeg.org](https://ffmpeg.org) |

## Start it

1. Download this repository (green **Code** button, then **Download ZIP**) and unzip it, or `git clone` it.
2. Double-click **Start on Windows.bat** or **Start on Mac.command**. The first time on a Mac, right-click it and choose Open. If it says permission denied, run `chmod +x "Start on Mac.command"` once.
3. Your browser opens http://127.0.0.1:4330. Keep the start window open while you use the app.
4. Open **Connect** in the sidebar and sign in to Claude and ChatGPT. Each one opens a terminal window and a browser sign-in. Press **Check again** when you're done.
5. Add your first account (**New**, then **Account**). The app studies how that account writes and looks, then builds its brand kit.
6. Write your first carousel from **Home**.

## Where your work goes

Everything stays in this folder on your computer:

| Folder | What's in it |
|---|---|
| `Writer/Clients/` | Each account's voice, questions, feedback and finished copy |
| `Designer/Brands/` | Your brand kits |
| `Designer/Carousels/` | Your designed slides and ZIPs |
| `App/Data/` | The app's list of everything, plus your uploads |

These folders are in `.gitignore`, so your own work is never pushed if you fork this repository.

## How it works

- `App/` is the web page and a small Node server. It starts `claude -p` in `Writer/` for writing and `codex exec` in `Designer/` for design.
- `Writer/` and `Designer/` hold the instructions both AIs follow (`Writer/CLAUDE.md`, `Designer/AGENTS.md` and the `System/` folders).
- `Skills/viral-carousel-writer/` is the writing method: rules, cover method and a library of 116 swiped winning carousels.
- The app removes any `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` from the runs, so they always use your signed-in subscriptions.

Usage counts against your own plans' limits. A full design run starts one Codex run per slide.
