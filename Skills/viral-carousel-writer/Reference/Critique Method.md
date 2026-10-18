# Critique Method

Used whenever the user says they do not like a draft, asks for a critique, or hands back an edit, and as the silent self-check before any delivery. The job is to judge the draft against the winners, not against taste: find what is wrong, show what the winners did instead, fix only what is broken, and save every mistake so it is never made twice.

## The seven steps

**1. Take his words literally.** Write down exactly what he objected to, in his words. "Too short", "corporate", "I don't understand what it's about" are findings, not moods. If he gave no reason, treat the whole draft as the suspect and run the full catalogue.

**2. Run the catalogue on every slide.** Go slide by slide through the problems below. For each hit, quote the offending line and its slide number. Do not give a verdict without a quote.

**3. Compare against the winners.** For every distinct problem, find two or three posts that solved the same problem well:
```
python "Scripts/Search Library.py" "<the problem in plain words>" --genre <genre> -n 5
python "Scripts/Search Library.py" --slides <NN>
```
Read the matching slides, then state the difference concretely: post number, what it did, what the draft did instead, and what the reader gets from the difference. A critique that cannot name a post it was measured against is opinion.

**4. Measure the draft against the numbers.** Slide count, median and range of words per slide, heading and label share, bullet slides, paragraph slides, cover words, subheadline, CTA kind and offer. Compare with `Numbers.md`. Treat an outlier as a question ("why is this 14 slides?") and never as a quota. If the draft is an outlier and the idea justifies it, say so and leave it.

**5. Fix only what is broken.** Feedback means edit that piece, never restart. Rewrite the slides the findings name, keep the rest word for word, and show before and after for each changed slide. If the problem is structural (wrong format, no question chain), say so, change the structure, and keep every line that survives.

**6. Save every mistake.** For each distinct problem found, by the user or by you, append an entry to `Feedback Log.md` the same turn, in its format (what was written, what was said, the rule, why it fails, how to check, library evidence). Check the log first: if an earlier entry already covers it, add the new instance under that entry and strengthen the check, do not duplicate. A mistake made twice is the worst failure this writer can have. If the lesson is about his voice, also add one line to the `write-like-me` skill's Feedback Log. Tell him in one line what was logged. Do not discuss the log unless asked.

**7. Re-run the gate and deliver.** Run the pre-delivery gate in `SKILL.md` again, then give the fixed carousel, the list of changes made, and the entries logged.

## The problem catalogue

Each entry has the test to run, why it hurts, and what the winners did.

| # | Problem | Test | Winners did |
|---|---|---|---|
| P1 | **A riddle cover** | A stranger cannot finish "this is about…" in two seconds | State the subject and a stake; hide the method (104, 95, 81) |
| P2 | **A reversal anywhere** ("it's not X, it's Y") | Search every sentence for a negation followed by a correction | Say the thing directly; where a misreading is real and specific, intercept it in one clause (22) |
| P3 | **A cover number the body does not honour** | Count what the cover promised against what the body delivers | Deliver every promised item, or promise only what the body holds (R6; 14, 85, 78, 49 are the warnings) |
| P4 | **Slide 2 restates the cover** | Does slide 2 give proof, the old belief, the frame or the fix? | 102, 75, 113, 73, 109, 95 |
| P5 | **An unbacked claim** | Next 40 words after each claim: number, name, quote, example, because? | R3: 102, 75, 86, 95, 110 |
| P6 | **An essay chopped into slides** | Does each slide stand alone, make one point and end on a hand-over? | One move per slide; shapes composed first (R13, R12) |
| P7 | **A heading on every slide, same style** | Count slides with a heading against the genre | Labels or numbers carry structure; a heading only where a concept is introduced (72, 79, 100) |
| P8 | **Bullets for a chain of reasoning, or vague noun-phrase bullets** | Are the bullets parallel, 3 to 5, verb-led, under 8 words? | 81, 85, 98, 108 |
| P9 | **A flat shape sequence** | Read the silhouettes in order: do two neighbours match where the moves differ? | Vary when the move changes; hold when parallel (R14) |
| P10 | **Copywriter staccato** | Three-word fragments each with a full stop; no commas | Flowing sentences, uneven length; fragments only with a speaker or a job (51, 53, 62) |
| P11 | **Corporate voice** | Would he say this out loud to someone he knows? | One person, direct, takes a side (`Voice.md`) |
| P12 | **A tip list the reader already knows** | Is there a named concept or a second name for the problem? | 73, 87, 97, 100, 109, 77, 75 |
| P13 | **Abstract insight** | Does the insight land as a scene, an analogy or a behaviour they catch themselves doing? | R27 |
| P14 | **The best line buried** | Is the belief-shifting line sharing a slide with other sentences? | Its own slide (22, 26, 30), unless its explanation is what proves it (42, 52) |
| P15 | **No assumption beat or objection** | Is the reader's real thought quoted in their words and answered? | 77% of the later posts quote the reader or enemy back (113, 13, 32) |
| P16 | **A superiority tax** | Does the post sneer, brag or claim to know what strangers did? | Credit luck, stay on their side of the table, state what you noticed (R5, R39) |
| P17 | **Too short, too thin** | Words per slide below the explaining band for slides that carry a reason or a story; fewer slides than moves | 45 to 80 words where a reason, example or story lives; 10 to 12 slides with real explanation (R15) |
| P18 | **Too long, padded** | Slides that restate; promotional frames counted as content | Count only distinct moves (R10) |
| P19 | **No worked example** | Does the reader see the idea working once, in full? | 86, 95, 99, 69 |
| P20 | **Invented facts** | Any number, name, quote, story not given or sourced | ADD marker (R1) |
| P21 | **A vague or corporate CTA** | Is the deliverable named with its form? Is the word the reader's own conclusion? Is the benefit in their life? | CTA Guide section 3 (113, 81, 109, 89) |
| P22 | **A second ask, or an ask before the proof** | More than one ask? Does the ask come after the value? | One ask on the last slide (R48) |
| P23 | **A close that summarises** | Does the last body slide repeat what was said? | Reformat the recap, or set the next move (09, 15, 16, 18) |
| P24 | **No humility, no laugh** | Is there one self-correction and one moment of humour? | R39, R38 |
| P25 | **Cover and visual do not match the argument** | A cover or look unrelated to the claim | 08, 12, 18, 10 (`Craft Moves.md` section 9) |
| P26 | **Signature AI vocabulary** | unlock, leverage, delve, tapestry, game-changer, "in today's fast-paced world", em dashes | R42; the AI-tell scrub catches the rest |
| P27 | **A principle taught and not followed** | Does the carousel do what it says? | 79, 108, 62 perform their own lesson; 14 to 17 are the warning |
| P28 | **A mismatched genre CTA** | Does the CTA fit the job (reach versus leads)? | R8, CTA Guide section 2 |

## How to word the critique

- Lead with the verdict that matters most to the reader's swipe, not the longest list.
- Each finding: slide number, the quote, the rule or post it breaks, the fix in one line.
- Rank findings by leverage (cover, slide 2 and the ask first; line-level last).
- Be a strategic partner, not a yes-machine: if the topic itself is weak or the slide is flabby, say so and cut or replace it.
- Keep it in the chat. Never save critique to a review file (`analysis-stays-in-chat`).

## When he hands back an edit

He rewrote a line, a cover or a slide. The edit is the most valuable feedback there is.
1. Diff his version against yours at the level of the move: what did he cut, add, reorder, name or soften?
2. State the pattern in one sentence ("he removed the second claim and moved the number first").
3. Search the library for a winner that does the same. If you find one, the rule has outside evidence; if not, it is his preference and still a rule.
4. Log it silently (Feedback Log; for a cover, also in the Covers corrections), then apply the pattern to the rest of the draft.
