# Mohr Insurance — Dynamic Sales Script

A branching version of the Mohr Insurance Medicare sales script. The agent answers
questions as the client answers them, and the script routes itself: the right avatar,
the right paragraphs, the right closing steps, and an umbrella price calculated from
the needs assessment.

## What's here

| File | What it is |
|---|---|
| `index.html` | The interactive script. One self-contained file — open it in any browser, no install, works offline. |
| `reference/dynamic-script-reference.html` | Printable branched version of the whole script. |
| `reference/Mohr_Dynamic_Script_Reference.pdf` | The same thing as a PDF, for printing or keeping open as a backup. |

To use it: download `index.html` and double-click it. Everything typed during a call is
saved to that browser, so a refresh or an accidental tab close doesn't lose the call.
"New call" clears it.

## The four avatars

The route is decided automatically from the client's own answers, in this order:

1. **Currently on Medicare** — already enrolled in Parts A & B
2. **Employer coverage** — not on Medicare, on an employer group plan with **over 20 employees**
3. **T65 — on Social Security** — not on Medicare, drawing Social Security
4. **T65 — not on Social Security** — everyone else

An employer plan with **20 or fewer employees** makes Medicare the primary payer, so
"delay Part A and B" is the wrong advice there. Those clients are routed onto the T65
track and the agent sees a note explaining why. The agent can override the route on the
CNA close screen if they disagree with it.

### What each avatar changes

- **Employer coverage** exits the needs assessment early — no Part B income or retirement
  asset questions — and goes to delay Part A & B → CMS L564 → Gold / Silver / Bronze.
  These clients never see the Supplement / Advantage presentation or the umbrella.
- **T65 on SS** gets the automatic-enrollment paragraph and "deducted from your check";
  **T65 not on SS** gets the manual-enrollment paragraph and "billed for the first quarter."
- **Currently on Medicare** gets a current plan review first (what they have, carrier, plan
  letter, what they pay, why they're shopping, which enrollment window), then a short
  "your foundation is already set" instead of an enrollment paragraph.
- The 3 closing steps switch between Scenario A, B and C to match.

## Umbrella pricing

Three answers in the needs assessment price the umbrella. Nothing else touches it.

| CNA answer | Medicare Supplement | Medicare Advantage |
|---|---|---|
| Cancer / heart attack / stroke is a concern | +$50 | +$50 |
| Skilled nursing is a concern | +$50 | +$100 |
| Dental is important to them | +$50 | included with the plan |
| **Maximum** | **$150** | **$150** |

Dental only prices into the Supplement side, because an Advantage plan already bundles it.

The quoted price is then:

- **Supplement** = Plan G premium + Part D (≈ $10) + umbrella
- **Advantage** = MAPD premium (usually $0) + umbrella

Both totals stay on screen from the moment the concerns are captured, so the number is
already computed when the agent reaches the pricing section. The agent can override
either umbrella on the pricing screen; "Reset to calculated" puts it back.

## Other things it does

- Captures the opening goals loop and reads every goal back in the formal recommendation
- Flags the compliance stops: no Scope of Appointment, and a client who doesn't make
  their own healthcare decisions
- Warns when a Supplement would be outside guaranteed issue, so underwriting gets set up
  as an expectation before the presentation
- Builds a copy-paste call summary at the end, downloadable as a text file
