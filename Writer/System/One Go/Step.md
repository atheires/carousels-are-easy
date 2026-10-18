# One Go

*The app lane. Idea to written carousel in a single run, with no stops.*

---

## When this runs

The carousel app (`../../../App/`) sends a job that names the client, the goal, and a brain dump that may be empty. Nobody is there to answer questions, so every choice is your own pick.

## What you are given

| Input | Meaning |
|---|---|
| Client | The folder in `Clients/`. Read everything the map lists for the start of a session |
| Goal or link | Free text from the operator, and it may be empty. It can be a plain goal (views, leads, sales calls, a launch), a link, or both. Empty means views first, then leads |
| Brain dump | The operator's raw idea. Treat it as the client speaking: use its words, facts and numbers verbatim. Empty means you choose the topic |

## The goal decides the width

Read the operator's goal line and match it to the nearest row. If it holds a link, open it with WebFetch before step 3, learn what the page offers and who it is for, and build the last slide and the comment word around sending people there. Never invent what a page says: if it will not open, say so in `inferred` and write the CTA from the goal words alone.

| Goal | Topic | Message and comment word |
|---|---|---|
| Views | As wide as the Playground allows | Light ask, the widest comment word |
| Leads | Still wide | Sharpened hard toward the offer, comment word points at the deliverable |
| Targeted views | Narrowed to the buyer on purpose. The one case where the topic may shrink | Written for that buyer only |

## The writing skill

Every carousel in this lane is written with the **viral-carousel-writer** skill at `../Skills/viral-carousel-writer` (next to this vault). Open its `SKILL.md` and follow "Always first", Mode 1 and the pre-delivery gate. It is the only writing method; the cover, the message and the slides all come from it. Its library searches are mandatory: run them with `python` from the skill folder.

Three things change because nobody is there:

| The skill says | In this lane |
|---|---|
| Ask one or two questions when a fact is missing | Never ask. Mark it `[ADD: …]` on the slide and list it in `inferred` |
| Deliver in chat with shape tags, alternate covers and notes | Save the slide copy only, in the Output Format. Nothing else goes in the file |
| Write in the author's voice | The voice is always the client's own `Successful Posts/DNA.md` |

The client's `About Client.md`, `Feedback/` files and DNA sit on top of the skill's rules, and the skill's rule against inventing facts about the author holds for every client.

## The run

1. **Read.** The skill's "Always first" list, then the client's files.
2. **Topic.** If the brain dump names one, find its question in `Burning Questions.md`, or add it there first. If the dump is empty, pick the strongest unused question for the goal. Run `Topic Virality Test.md` yourself and move to the next question if it comes back red.
3. **Decide, search, plan.** Mode 1 steps 2 to 4: the job, the genre, the slide count from the moves the idea holds, at least four library searches, the borrow list and the slide shapes.
4. **Cover.** Mode 1 step 5. Keep the best cover only.
5. **Write.** Mode 1 steps 6 and 7.
6. **Gate.** Mode 1 step 8 and the skill's pre-delivery gate, then the gate in `Standards/Universal Feedback.md`. Fix what fails.
7. **Save** as `Output Format.md` says to `Clients/[name]/Written Carousels/[name].md`.
8. **Memory.** Strike the question through with its angle, log the comment word, update `Memory/Current State.md`.

## Progress lines

The app shows a live pipeline, so say where you are. Before each part of the run print one line by itself, exactly in this form, and nothing else on that line:

| Line | Print it when |
|---|---|
| `STAGE: reading` | You start reading the client's files |
| `STAGE: topic` | You start the topic step |
| `STAGE: headline` | You start the cover |
| `STAGE: draft` | You start writing the slides |
| `STAGE: review` | The first draft is complete and you start the pre-delivery gate |
| `STAGE: revise` | You start fixing what the gate caught |
| `STAGE: save` | You save the file and update memory |

A rewrite job prints `STAGE: draft`, `STAGE: review`, `STAGE: revise` and `STAGE: save` the same way.

## The report

Never ask a question. End your final message with one fenced `json` block and nothing after it:

```json
{
  "title": "three or four plain words that name this carousel; it is also the file name without .md",
  "file": "Clients/<name>/Written Carousels/<title>.md",
  "topic": "the burning question used",
  "angle": "the angle recorded",
  "commentWord": "WORD",
  "inferred": ["each fact, number, example or claim you supplied that the client did not"]
}
```

`inferred` is the honesty line. Anything the client did not say goes in it, however small.

## Rewrites and edits

A follow-up job on the same carousel carries either a change request or the operator's own edits. For a change request, rewrite the file in place and send the report again. For edits, the file is already changed: learn from them the way the Memory rules in `CLAUDE.md` say, silently, and reply with one line. A correction that would improve any client's carousels also goes in the skill's `Feedback Log.md` as a new entry in its own format.

---

## Connected Notes

- [[CLAUDE]]
- [[One Go/Topic Virality Test|Topic Virality Test]]
- [[One Go/Output Format|Output Format]]
- [[Learning the Client/Account Study|Account Study]]
