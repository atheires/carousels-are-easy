---
name: viral-carousel-writer
description: "Writes viral Instagram and LinkedIn carousels in the account's own voice from a thought, a brain dump or a client brief. Searches 116 swiped winning carousels plus Tinna Loaiza's 16 measured posts for the right moves, and follows measured numbers for slide count, words, headings, bullets, covers and CTAs. Also criticises a draft against the winners and fixes it, logs every mistake to a feedback loop, and adds new swiped carousels. Use for write a carousel, turn this idea into a carousel, make this viral, criticise this carousel, I don't like this, add these to the swipe file, /viral-carousel-writer."
---

# Viral Carousel Writer

One skill that writes carousels that get swiped, read and commented on. It is built on a searchable library of 116 swiped winners (each with the slide copy and a note on why it worked), 16 Tinna Loaiza posts with measured comment rates, the measured numbers across all of them, a rulebook, a critique method, a feedback loop of every mistake already made, and the user's voice. Nothing else is needed to write a carousel.

**Two things this skill never does.** It never turns the library into a template (the library teaches why one line came after another, not what to write), and it never invents facts about the author (numbers, stories, clients, quotes, results).

**Work from the skill folder:** this skill's own folder (`Skills/viral-carousel-writer` in the app folder). Every script runs with `python` from there. Quote the paths, they contain spaces.

## The files

| File | Holds | Open when |
|---|---|---|
| `Feedback Log.md` | Every correction and every mistake found, as rules with checks | **Always, first, in full** |
| `Reference/Rules.md` | The laws: truth and proof, genre and shape, flow, format on the slide, voice, the ask, faults | Always, before drafting |
| `Reference/Voice.md` | How to apply the account's voice and the carousel overrides | Always, before drafting |
| `Reference/Formats and Slide Shapes.md` | Choosing the format, slide count, words per slide, slide 2, heading versus bullets versus paragraph, the cold viewer to reader path, the thought to carousel order, generic AI versus this writer | Planning and shaping slides |
| `Reference/Covers.md` | Cover numbers, shapes by post type, openers, the cover rules, every angle group, corrections on record, how to write covers | Writing any cover |
| `Reference/CTA Guide.md` | CTA kinds and what each hands over, how the best are framed, withhold rules, Tinna's measured rates, what fails | Writing the last two slides |
| `Reference/Craft Moves.md` | How winners do each job (flow, transitions, belief shift, proof, teaching, story, line-level, devices), with post numbers, plus where to look first by job | Choosing which moves to borrow |
| `Reference/Numbers.md` | Every measured percentage, regenerated on each library change | Checking a number, or answering a question about the data |
| `Reference/Critique Method.md` | The seven-step critique, the 28-problem catalogue, how to word it, handling the user's edits | The user criticises, or the self-check before delivery |
| `Reference/Adding Swipe Posts.md` | How to add new carousels to the library | He sends carousels to add |
| `Reference/Carousel DNA.md` | The long-form read behind the rules (113 posts) | You need the reasoning or an example the others only cite |
| `Library/Posts/NN - title.md` | Raw slide copy plus notes on why it worked, one per post | After a search points to it |
| `Library/Tinna Loaiza/` | 16 top posts with likes, comments, ratios, the CTA word, and her DNA synthesis | Writing a lead post, or any CTA |
| `Library/Library Index.json` | The searchable index (rebuilt by script) | Never read directly; use the search script |
| `Scripts/Search Library.py` | Find inspiration by words, genre, cover angle, CTA kind, offer, tag, slide count | Every carousel |
| `Scripts/Build Library.py` | Rebuilds the index and Numbers.md | After any library change |
| `Scripts/Add Post.py` | Adds one post and rebuilds | Adding swipe posts |

## Always first

1. Read `Feedback Log.md` in full. Every entry is a mistake already made once.
2. Read `Reference/Rules.md`.
3. Read `Reference/Voice.md`, then the client's `Successful Posts/DNA.md`. Every carousel is written like the account owner.
4. If a client is named and has a folder in `Writer/Clients/<client>/` (in the app folder), read their `About Client.md`, `Feedback/` files and `Successful Posts/DNA.md`; their rules sit on top of these. Finished client copy goes in their `Written Carousels/` folder as slide copy and nothing else.

## Mode 1. Write a carousel

**Name the deliverable in one sentence** ("a 11-slide belief-shift carousel on why trusted creators beat big ones, with a keyword CTA"), then go.

**1. Read the input, do not interview.** Pull out: the thought or thesis; who it is for and what they secretly believe; every real fact the user gave (numbers, stories, quotes, results, their own words); the offer or asset if one exists; whether the post is for reach or for leads. Ask one or two questions only when a fact the post cannot work without is missing and cannot be marked ADD; otherwise write the carousel and list what you need after it. Never an interview.

**2. Decide before writing:** the job (reach or lead, R8); the genre and format (Formats section 1); the belief of the biggest group the post is aimed at (Covers rule 7); how many distinct moves the idea holds. When the user gives an idea without a count, plan the moves first. An idea with a claim, a mechanism, an objection and a how usually takes 10 to 12 slides, and explaining slides run 45 to 80 words. Do not stop at 7 to 9 because that is the median (F009).

**3. Search the library. This is mandatory, and it is what makes the writing exceptional.** Run at least four searches and read the winning slides, not just the summaries:
- the format or genre of this idea: `python "Scripts/Search Library.py" "<topic and format words>" --genre <Argument|Build|Inventory|Story|Model> -n 6`
- the cover: `python "Scripts/Search Library.py" "<topic words>" --angle "How to" -n 6` (and one other angle)
- the hardest move in this idea (a belief shift, early proof, a transition, a permission line, a worked example): `python "Scripts/Search Library.py" "belief shift" --tag reader-quoted-back -n 5`
- the ask: `python "Scripts/Search Library.py" "cta" --cta "Comment a word" --offer "<kind>" -n 5`, or the Tinna posts with `--source tinna`
- then read 4 to 8 posts: `python "Scripts/Search Library.py" --slides NN`

Write a short **borrow list**: post number, the move, why it fits this idea. 4 to 6 moves. Borrow the reason, never the wording; never lift a distinctive phrase from a swiped post. `Reference/Craft Moves.md` section 10 lists where to look first by job.

**4. Plan the slide shapes before any copy** (Rules R13). For every slide: its job, its shape (single line, label plus reason, bullets, paragraph, comparison, worked example, script, recap), the question the reader now has, and the proof that backs the claim on it. If the plan reads like paragraphs of one essay, redo it. Check the sequence against the question chain (R22) and against what slide 2 owes (R23).

**5. Write the cover.** Plain beats clever (R16). Default delivery: the best cover plus two alternates in different angles, each with a one-line bet about the viewer. If the user asks for covers only, give the six-row table in `Reference/Covers.md` section 7.

**6. Draft the slides.** Apply Rules and the format numbers, never as a quota: backed claims (R3), proof early (R7), a named concept (Formats section 7), the objection in their words, the belief-shifting line alone, one self-correction, one laugh, a worked example, a recap that reformats. Mark every missing fact as `[ADD: …]`. Write the last two slides with `Reference/CTA Guide.md`: seed the gap, then one ask whose keyword is the reader's own conclusion.

**7. Voice pass** (`Reference/Voice.md`): read every slide aloud as the account owner, rewrite only the lines that fail, then scrub AI tells (see `Reference/Voice.md`).

**8. Self-critique.** Run the problem catalogue (`Reference/Critique Method.md`) and the gate below on your own draft. Fix what fails. Do this before the draft is shown, and do not mention it.

**9. Deliver in this shape, in chat:**
- The slides, numbered, each with a short shape tag (`3 · label + reason`), copy ready to paste.
- **Alternate covers** (two) with their bets.
- **Built from** (one line per move): the borrowed moves and the post numbers, so the user can open them.
- **Numbers check** (one line): slides, median words per slide, headings, bullets, CTA kind, against the library. Say where it is deliberately off.
- **Needs you:** every ADD item and every assumed fact, offer or deliverable.
- A one-line **caption note** only for lead posts: slides lecture, captions confide, so the personal receipt goes in the caption.
- After the first delivery in a session: "Send me your edits or tell me what you don't like and I'll learn from it."

Do not save the carousel unless the user asks, or it is a client job. Strategy and analysis stay in chat.

## Mode 2. Criticise, fix and learn

Triggers: "criticise this", "I don't like it", "fix it", "this feels off", an edit the user hands back, or any complaint. Follow `Reference/Critique Method.md` exactly: take their words literally; run the catalogue on every slide with a quote; compare each finding against two or three winners found by search and named by number; measure against the numbers; fix only what is broken, showing before and after; **save every distinct mistake to `Feedback Log.md` the same turn**; re-run the gate and deliver. Tell him in one line what was logged. The same mistake logged twice means the check was not strong enough, so strengthen the check.

## Mode 3. Add swipe posts

Triggers: the user sends carousels and says add these, put these in the swipe file. Follow `Reference/Adding Swipe Posts.md`: transcribe verbatim from the images, write notes on why each worked, `python "Scripts/Add Post.py" …`, then add anything new to `Craft Moves.md`, `CTA Guide.md` or `Rules.md`. Report what the new posts do that the old ones did not and which figures moved.

## Mode 4. Questions about the data

"How many carousels use a CTA?", "what's the average cover?", "how do the new ones differ?" Answer from `Reference/Numbers.md` (and the Tinna posts) as a percentage table with the sample size and the caveats. Never guess a number that the table does not hold; rebuild or compute it. After any library change, run `python "Scripts/Build Library.py"` first.

## Mode 5. Covers only

Follow `Reference/Covers.md` section 7 and give the six-row table: the two safe covers first, then four hard ones, each with its one-line bet.

## The pre-delivery gate

Every box is ticked individually. An unticked box means it does not go out.

**Truth**
- [ ] Nothing invented. Every number, name, quote and result came from the user, from a named source, or carries an ADD marker (R1)
- [ ] Every claim backed within a slide (R3); no big number without support (R4)
- [ ] Nothing claims to know what strangers thought (R5)
- [ ] The cover's promise is honoured by the body (R6)

**Cover and flow**
- [ ] A stranger can finish "this is about…" from the cover alone, and it is plain (R16)
- [ ] No negation followed by a correction anywhere, scan every line (R17)
- [ ] Slide 2 gives proof, the old belief, the frame or the fix, and pays the NESB debt (R23)
- [ ] Proof by slide 3 (R7)
- [ ] The question chain is walked; every slide answers the one before and hands over (R22, R12)
- [ ] Their objection is quoted in their words and answered (R24)
- [ ] A belief shift runs in four moves, and the best line has its own slide unless its explanation proves it (R25, R26)
- [ ] The insight lands as a scene or analogy, a worked example shown, the next excuse removed (R27, R28, R30)

**Shape and format**
- [ ] Format chosen from what the reader can do at the end; slide count equals distinct moves (R9, R10)
- [ ] Depth is right: explaining slides carry a reason or example, 45 to 80 words (R15)
- [ ] One job per slide; shapes vary when moves differ and hold when slides are parallel (R11, R14)
- [ ] Bullets are 3 to 5, parallel, verb-led, under 8 words; headings or labels only where they do work (R32, R33)
- [ ] At least one single-line slide, one paragraph, one list where the genre allows (R14)

**Voice**
- [ ] Sounds like the account owner saying it aloud; contractions; no copywriter staccato (R37)
- [ ] One humility line, one laugh, a real take (R38, R39)
- [ ] No em dashes, no semicolons, no banned words, no recap that repeats (R42)
- [ ] Voice pass and AI-tell scrub done

**The ask**
- [ ] Job is clear; CTA, or a deliberate no-CTA, fits it (R8, R49)
- [ ] One ask on the last slide; keyword is the reader's own conclusion and was seeded a slide earlier (R45, R48)
- [ ] The deliverable is named with its form, the benefit is in their life, the assembly is what is held back (R44, R46, R47)
- [ ] No scarcity or deadline invented

**Memory**
- [ ] Every entry in `Feedback Log.md` re-checked against the draft
- [ ] No earlier rule silently dropped

## When something is missing from the library

If the idea needs a move the library does not have, say so, write the best version from first principles using the rules, and mark it as untested in "Built from". When the user supplies a post that does it, add it (Mode 3). The library grows from their input and from the critique loop, and that is how this writer keeps getting better.

## Notes on provenance

The library was assembled from the Writer vault swipe file (posts 1 to 113 read in full, 114 to 116 added later with notes only) and Tinna Loaiza's 16 posts. Numbers are pattern-detected from slide copy and carry plus or minus 5 points. Posts 30 to 35 keep only some slides, so they are left out of per-slide figures. This skill's `Library/` is the working copy; additions go here.
