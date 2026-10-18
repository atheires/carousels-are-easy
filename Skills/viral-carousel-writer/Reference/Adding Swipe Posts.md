# Adding Swipe Posts

When the user sends carousels to add to the swipe file (screenshots, a PDF, pasted copy, a link, or a folder of images), this is the procedure. The library only gets better if every post is transcribed verbatim and read for why it worked. Never paraphrase the copy.

## 1. Get the slide copy, exactly as written

- **Images or PDFs:** read each image with the Read tool, slide by slide in the order shown. Transcribe every word exactly: typos, capitals, line breaks, emoji. Describe non-text content in one italic line (`*Screenshot of a payout dashboard.*`), because the copy parser skips short italic descriptions.
- **Pasted text:** keep it as given.
- **A link:** try to fetch it; Instagram often refuses anonymous requests. If it fails, ask for the screenshots instead of guessing. Never fill in slides you could not see.
- If slide numbers are missing or out of order in the source, say so in the notes and keep the supplied order. Do not reconstruct.

Format each slide as a block:

```
**1 — cover**

The cover text exactly.

*Italic description of any image.*

**2**

Slide 2 text exactly.
```

Slides with a role can carry it after the number: `**9 — CTA**`.

## 2. Find the facts

- **Account:** the handle if shown, else `Unknown`.
- **Slides:** the real count.
- **Genre:** one of Argument, Inventory, Build, Story, Curation, Model (a named framework or ladder), Offer. A hybrid takes two, first the primary: `Argument / Inventory`.
- **Caption:** keep it verbatim if given (Tinna Loaiza's rule is that slides lecture and captions confide, so the caption matters).
- **Performance:** if likes and comments are shown, put them in the notes. Never invent a number.

## 3. Write the notes: why it worked

Notes are the part the search ranks on. Write 3 to 6 bold lead sentences, each followed by the reasoning, in the style of the existing posts (look at 75 or 116).

Each lead names one move and where it sits: what the cover does, what slide 2 does, the turn, the ask, a device that is new. The reasoning says what the move does to the reader and why this line came after that one, never a template to apply mechanically. Compare with an existing post that does the same thing (`[[NN - title]]`). Note any fault as a fault.

Also check:
- What does this post do that the library does not? (A new cover shape, a new CTA offer, a new structure.) Add it to `Craft Moves.md` under the right heading with its post number.
- Does it contradict a rule? State it as a "complicates the file" note in `Rules.md` (section H) or the right reference, never silently.
- Is the CTA new in kind or in framing? Add a line to `CTA Guide.md`.

## 4. Add it

Write `copy.md` and `notes.md` in the scratchpad, then:

```
python "Scripts/Add Post.py" --title "…" --account @… --slides N --genre Build --copy copy.md --notes notes.md [--caption caption.md]
```

That numbers the post, saves it in `Library/Posts`, adds a row to `Library/Original Index.md` and rebuilds `Library/Library Index.json` and `Reference/Numbers.md`. For many posts, add them one at a time; the build is quick.

## 5. Report what changed

In one short paragraph, tell the user: how many posts were added, the new library total, what the new posts do that the old ones did not, and the one or two figures in `Numbers.md` that moved (for example, the share of covers with a digit, or the share of CTAs offering a video). Do not recite the whole table.

## 6. Check the parse

Open the printed post with `python "Scripts/Search Library.py" --slides NN`. Every slide should appear. If the slides merged into one block, the numbering format is wrong; fix the copy file and rebuild. Posts with only some slides retrieved are marked `(sampled)` in the heading (`## Slide copy, verbatim (sampled)`), which keeps them out of the per-slide averages.

## Rules

- Verbatim copy, always. The analysis lives in the notes.
- Never turn a breakdown into a template. If a note could be applied mechanically to any topic, it is wrong and gets deleted.
- Never discard a post because it is weak. Note the weakness. The file also warns against faults.
- A copy analysis that feeds the library does so silently when it comes from another skill's work; when the user supplies the posts here, tell them what was added.
