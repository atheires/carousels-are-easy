# Brand kit build guide

*The app lane for building a brand kit. The operator reviews every stage in the carousel app, so each job does one part and stops.*

The model for a finished kit is `System/Example Kit`: read its `Branding.md` and `Feedback.md` once before writing a new kit, and copy their structure, never their look.

## What a kit folder holds

| File | What it is |
|---|---|
| `Branding.md` | The brief. First line is `# ` and the kit's name |
| `Feedback.md` | Every correction the operator gives, as standing rules. It wins over `Branding.md` |
| `References/` | The operator's reference images, copied in unchanged |
| `Sample cover.png` | Slide 1 of the sample carousel |
| `Sample/Copy.md` | The sample carousel's copy |
| `Sample/Slide N.png` | Slides 2 onward of the sample carousel |
| `Sample/Drafts/` | Every earlier version of a slide. Nothing is ever deleted |

## Rules for every part

- **Images** are made with `python "../Skills/gpt-image/codex_image.py" -p "<prompt>" -f "<out.png>" -i "<reference.png>" --size "3:4 portrait (1080 by 1440, NOT taller)"`. `-i` can be repeated. To make several slides, write one small Python script that runs one call per slide at the same time (a thread pool) and run it once.
- **Every slide is 3:4.** Say the ratio in every prompt.
- **One attempt per slide.** No critic, no self-review round, no second try unless the file is missing. The operator is the reviewer.
- **Never change the copy** to make a layout work. Change how it is presented.
- **Give the exact text** in the prompt and say "this text and nothing else". State the safe margin, the text sizes and how much of the slide the imagery may take, in words; the image model fills the canvas unless told otherwise.
- **Before replacing an image**, copy the current one into `Sample/Drafts/` as `<name> v<next number>.png`.
- **The operator's reference notes** say what they liked in each image (`@img N` means that exact image). Take from each reference only what they named. A reference is a starting point for layout and feel, never something to copy people, logos or colours from unless they say so.
- **Never ask anything.** End each part with one line saying what was made.
- Print a progress line before each step, alone on its line: `STAGE: reading`, `STAGE: brief`, `STAGE: copy`, `STAGE: cover`, `STAGE: slides`.

## What every `Branding.md` must contain

Same sections as `System/Example Kit/Branding.md`: files in the kit, the laws of this look (2 to 4), the recurring characters or imagery, colour with hex values, type with sizes for a 1080 by 1440 slide, spacing, text on the slide, how much of each slide the imagery may take, layouts (cover, body layouts, closing slide), a Never list, and prompt notes.

These hold for every kit unless the operator's notes say otherwise:

1. **A safe border on all four sides.** No text crosses it, and it is the same on every slide.
2. **Negative space.** At least a third of a body slide is empty background. Never fill the slide edge to edge.
3. **Headings big, never huge.** If the heading stops the eye reading the rest, it is too big. Body text never under 32 px.
4. **Imagery needs a purpose.** Every character or image goes with the idea of that slide and adds to what it says. On a body slide imagery takes a quarter at most; on the closing slide a third; on the cover up to half.
5. **Long text is broken** into bullets or chunks of two lines at most. Numbering is plain (`1. The Swipe File`). A set of numbers sits in one row.
6. **One background** across the deck. No inverted slides.
7. **The cover** carries the account's handle small at the top when the kit has an account, and its headline is one line or three or more, never two.

## Part A. Brief, sample copy and cover

1. Read the reference images the job names and the operator's notes. Copy the references into `References/` unchanged.
2. Write `Branding.md` and an empty `Feedback.md` (a `# Feedback` heading and the line "Every line is a standing rule for this branding.").
3. Write the sample carousel with the **viral-carousel-writer** skill at `../Skills/viral-carousel-writer`: follow its "Always first", Mode 1 and its pre-delivery gate, without asking anything and without the chat delivery. Topic: if the kit has an account, pick one from that account's world (`../Writer/Clients/<account>/About Client.md`); with no account, any topic that suits the look. 8 to 11 slides, so the kit shows a cover, a quote or statement slide, a numbered teaching slide, a list, a number row and a closing slide. Never invent facts about a real person: use general, checkable points. Save it as `Sample/Copy.md`, each slide under a line reading `Slide N`.
4. Generate **the cover only** and save it as `Sample cover.png`. Stop there.

## Part B. Redo the cover

The job carries the operator's note, already saved in `Feedback.md`. Update `Branding.md` so the rule holds from now on, keep the old cover in `Sample/Drafts/`, and make one new `Sample cover.png`. With no note, look at the cover against the references and the brief, decide what is weakest, fix that, and add one line to `Branding.md` saying what changed.

## Part C. The rest of the slides

The operator approved the cover. Attach `Sample cover.png` to every run so the deck matches it. Make every slide from 2 onward at the same time and save each as `Sample/Slide N.png`. Give each slide a different layout from the brief where the copy allows, so the operator can choose between them. Then add to `Branding.md` which layout each slide used.

## Part D. Redo slides after review

The job carries a note per slide and sometimes one for the whole deck, already saved in `Feedback.md`. First turn every note into a standing rule in `Branding.md` (a note about one slide almost always applies to all of them). Then remake only the slides named, at the same time, keeping the old ones in `Sample/Drafts/`. A slide the operator praised becomes the reference attached to the other runs.

## Part E. Approved

Nothing to generate. The app marks the kit ready. `Branding.md` should already say which slides are the standard.
