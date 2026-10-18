# App Guide

The carousel app is a local web page on http://127.0.0.1:4330 that sends writing jobs to Claude in `../Writer/` and design jobs to Codex in `../Designer/`.

## Start it

Double-click `Start on Windows.bat` (Windows) or `Start on Mac.command` (Mac) in the main folder. Keep that window open.

## Files

| File | Job |
|---|---|
| `server.cjs` | Everything behind the page: reads the vaults, the job queue, the Claude and Codex runners, the Instagram download |
| `index.html`, `app.js`, `styles.css` | The page |
| `Queue Test.cjs` | Checks for the copy parser and the queue. Run `node "Queue Test.cjs"` |
| `Data/index.json` | Carousel status, posted marks, the brand kit list (`kits`: folder, name, client) and client notes. The vault files stay the truth |
| `Data/Uploads/` | Screenshots, references (`img 1`, `img 2`, up to 10), downloaded account posts and their small reading copies |

## What belongs to an account

| Part | Where | Fed by |
|---|---|---|
| My writer | `Writer/Clients/<client>/`: About Client, `Successful Posts/DNA.md` (shown as How I write), Burning Questions, `Feedback/` | The account study, every note sent from the copy review, "Tell the writer something" in the Feedback sub-tab |
| My designer | One or more brand kits. A kit is a folder with `Branding.md`, sample images and `Feedback.md` | The kit build at onboarding, every slide note, "Tell the designer something" on the kit page |

A kit is a kit only when it is listed in `Data/index.json`. Kits made by the app live in `Designer/Brands/`; three older ones point at carousel folders (Doodle, Shoot Your Shot, Cobalt).

The Writer tab has About, How I write, Burning questions and Feedback sub-tabs, remembered in the hash. It reads optional short files in `Writer/Clients/<client>/App Summary/`: `About.md`, `How I Write.md` and `Burning Questions.md`. Without a short file it shows the full document. The full files remain editable through the existing rich editor. Kit briefs follow the same pattern with an optional `<kit>/App Summary.md`. These summaries are read only by the app.

Home shows all recent carousels in a horizontal slider. Saved uses the same soft pop-up filters as Home. Card and carousel-page icons toggle posted or open a deletion box. The carousel back link remembers whether it came from Home, Saved or an account.

Reference chips are numbered in their current order. Type `@` in the brain dump to choose a thumbnail, using arrows and Enter or clicking it; Escape closes the list. The inserted `@img N` tag refers to that exact image. Removing a reference renumbers the chips and tags. References are uploaded as `img N` at Generate.

The five-node timeline is visible during writing, copy review and design. Progress is forward within a run; Review needs a freshly written copy file. Completed pages show a small completion line, the slides and quiet file/download controls. Image elements stay in place during live updates, and image URLs use file modification times.

Click a slide to open the window-sized viewer. Its slim bar has the count, version dots, Redo and Close. Redo opens a note panel: save and redo starts a design job, while save for next time only adds a rule through the kit feedback route. Escape closes that panel before closing the viewer.

`DELETE /api/carousels/:id` refuses queued or running work. It moves existing files into `Removed on <spoken date>/` at the Carousels root: design folders under `Designer Carousels/`, and copy under `Writer Clients/<account>/Written Carousels/`. Registered kit folders stay in place. Index tombstones in `removedCarousels` prevent removed entries from being imported again. Files are preserved, including when a same-name archive already exists.

Static files, including `app.js` and `styles.css`, are served with `Cache-Control: no-cache`. Code changes to the server take effect at its next normal start; editing its file does not change the process already running.

## How a job reaches the vaults

| Job | Runs | Follows |
|---|---|---|
| Write a carousel | One `claude -p` in `Writer/` | `Writer/CLAUDE.md`, then `Writer/System/One Go/Step.md`, which writes with the `viral-carousel-writer` skill in `../Skills` (the run may read that folder and run its `python` search scripts). It prints `STAGE:` lines that move the pipeline on the page |
| Rewrite after feedback | Same Claude session | The note is saved to the client's `Feedback/Writing.md` first, then "Rewrites and edits" in the One Go step |
| Onboard, the writing | One `claude -p` in `Writer/` | `Writer/System/Learning the Client/Account Study.md` |
| Build a brand kit | `claude -p` in `Designer/` on Opus, medium effort, one run per reviewed part | `Designer/System/Brand kit build guide.md`. Part A writes the brief, writes a sample carousel with the `viral-carousel-writer` skill and makes the cover only. I approve or redo the cover, then the other sample slides are made, then I note slides to redo or approve the kit. A kit is a draft (`stage` in `Data/index.json`) and cannot be used until approved. Images are made through `codex_image.py`. Kit cards show the kit's own sample slides, never my references. Deleting a kit moves its folder to `Removed on <date>/Designer Brands/` |
| Design a carousel | One `codex exec` per slide in `Designer/`, all started together | `Designer/AGENTS.md`, the cover, body or closing slide guide and its feedback log, the kit's `Branding.md` and `Feedback.md`. The app packs the ZIP |

One Claude job and one Codex job at a time; a design job counts as one job even though it runs a process per slide.

## Instagram accounts

A handle is downloaded with `gallery-dl` using your own cookies at `App/Data/Instagram Cookies.txt` if you add one (up to 200 slide images, about the last 20 posts). If Instagram gives nothing, drop screenshots instead.
