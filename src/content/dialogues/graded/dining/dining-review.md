# Remaining dining — item reading ledger

Reader: Codex implementation agent. Method: model-assisted postdraft source reading, including every question, its own two answers and effects, level rationale, situations, endings, repairs and both path orders. Date: 2026-09-09. Human teacher reads: **0**. No source wording copied; source basis is local evidence document's CEFR oral-interaction/goods-and-services/clarification design mapping, not certification. No medical or legal advice.

## restaurant-order

Read A1/A2/B1/B2/C1: 12 Q + 24 A each (60 Q /120 A). All 12 keys per level read: meal, portion, drink, chilli, side, timing, bread, cutlery, bill, payment, seat, purpose. IDs are `restaurant-order.LEVEL.KEY`, each with owned `.a` and `.b` (explicit complete enumeration will be appended before commit).

Actual corrections on postdraft read: A1/B2/C1 bread transitions now explicitly discuss timing rather than presume acceptance of a twenty-minute wait. B2/C1 refusal of bread no longer says waiting is fine after a potentially time-constrained answer. Reread corrected Q/A pairs immediately in patch; no new fact effects. All dishes are pasta with the same optional additions, so no steak/chicken applicability mismatch exists. Short closings only confirm discussed choices. C1 differentiates preference from requirement and handles implicit social meanings, not only longer requests. All endings/repairs read; 2 shared scene situations ×5 levels, no real payment or reservation claims. Remaining concern: model reading is not independent teacher review.

Status: authored/read 60/120, metadata still draft pending explicit attestation update. Analysis pending.

## food-allergy

Postdraft read A1/A2/B1/B2/C1: 12 Q +24 A each, 60/120 total, plus each rationale and both situations/all endings/repairs. Keys each level: allergen, food, check, extras, preparation, uncertainty, format, card, record, next, contact, version. Each key's `.a`/`.b` read with its fact value, with both path orders considered. Actual correction: A2 contact.b no longer presumes an allergy card after card.b chooses verbal explanation; it now gives an in-person follow-up-question reason. Reread corrected pair in patch. Conditional uncertainty responses do not end the enquiry or prove any food suitable; they establish intended response to missing information. The list is explicitly a list of questions, not verified findings. No diagnoses, treatment, allergens falsely declared absent, or safety guarantees. 60/120 authored/read; labels still draft until attestation. Human reads0.

## return-item

Postdraft read all five levels' 60 Q/120 A, rationales, situations, endings, repairs, request/evidence/state effects and both path orders. Keys: request, reason, receipt, date, condition, inspection, queue, record, policy, next, carry, desk; each `.a`/`.b` read. Corrections: A2/B1 duplicate-gift reason specifies duplicate design so an exchange for another design remains sensible; A2 queue no longer declares immediate departure before optional brief questions; C1 desk uses “discussion” instead of ambiguous “exchange”. Reread corrections in patch. Policy scope is explicitly fictional, unused opened packaging is allowed, 7/10 days both fit14, refund only original card, same-price exchange only current stock, inspection permission never equals approval. Record means enquiry summary, not evidence of payment. 60/120 authored/read; human0; labels remain draft until attestation.

## supermarket-help

Postdraft read all five levels' 60 Q/120 A, rationales, both situations, closings/repairs and fact effects in visit/planning paths. Keys: product, navigation, size, brand, compare, checkout, reach, bag, fallback, label, carrier, purpose; both answers per key. Corrections: A1 fallback says food pack, avoiding ambiguous “bag” after shopping-bag question; B2/C1 bag reasons no longer call a planning variant unplanned; B2 carrier question and C1 purpose question/replies rewritten as natural spoken choices instead of awkward abstract phrasing. Reread revised pairs in patch. Both products genuinely share aisle3 and both sizes/brand ranges in the stated fiction; no unsupported numerical price comparisons; label reading gives no food-safety advice. 60/120 authored/read, teacher0; attestations pending.

## price-discount

Postdraft read all five levels' 60 Q/120 A, rationales, two situations, every ending/repair and effects. Keys: item, budget, check, request, boundary, alternative, bundle, wrap, payment, decision, hold, inspect; each `.a`/`.b`. New/display prices20/16, pouch12, two-new total36/per-item18, wrapping2 are explicit fiction; no stacking or successful invented payment. Budget18/20 may not afford a preferred new tote plus wrapping, so the next step offers a final total check rather than falsely guaranteeing affordability. Comparing cheaper goods does not silently change a tote selection. Both accepting a limit and declining purchase are legitimate. Found real order issue in metadata: planning previously put boundary(5) before request(4); corrected planning order to1,3,2,4,5,6 so refusals are respected after the request, not before it. Reread the resulting 4→5 sequence at all levels and other scenes' planning sequences; no text edited by that metadata change. 60/120 authored/read, teacher0; no unresolved item correction.

## Attestation decision

All300 questions and600 owned answers have now been read after drafting, with the corrections above reread. Metadata-only row annotations may now record this completed reading; they do not perform or certify it. All25 unit rationales, 50 level-variant instances (two shared authored situations per scene), 150 mode paths and all scene repair/closing prose were considered in that reading. Structural counts still await GREEN. Eligible model-read counts:300Q/600A; teacher0; draft0 after annotations. No claim of independent teacher review or CEFR certification.

## Analysis

Postdraft source read of all15 entries, all75 level-labelled examples and75 substitutions, all Chinese meaning/grammar/register/confusion notes, scope/forms/IDs and sources. IDs read: restaurant.word.portion; restaurant.phrase.on-the-side; restaurant.sentence.no-chilli; allergy.word.ingredient; allergy.phrase.allergic-to; allergy.sentence.peanut; return.word.refund; return.phrase.proof; return.sentence.request; supermarket.word.aisle; supermarket.phrase.unit; supermarket.sentence.show; price.word.discount; price.phrase.budget; price.sentence.leave. For each entry, A1/A2/B1/B2/C1 example and substitution were individually read, not generated by a helper. Corrected portion.B2 substitution to a natural purpose clause, allergic-to.C1 from “identifying the enquiry” to “explaining why I am asking”, and refund.B2 from “resolve my need” to “suit my situation”; reread corrected pairs. Ambiguous “Please show me” requires supermarket-help.A1.navigation; no automatic target inference. Sources support task design, while grammar notes/examples are original local authored explanations, not copied dictionary text. Authored/read/eligible15 entries+75examples+75substitutions; draft0 after explicit annotations; human0. Coverage deliberately bounded, not a full dictionary or general parser.

## Self-review

After first focused GREEN518, found that planning situations must stand alone rather than refer to “the same” unseen visit situation. Reset variant attestations to draft, expanded all five planning descriptions with their own product/role/default/price-or-policy facts, then actually reread the resulting source headers including both situations and all closings/repairs. Restaurant now explicitly introduces companions before discussing separate bills. Price visit summary now accurately says final-total check or no purchase, not an unimplemented unconditional price acceptance. Reread that last summary correction in the patch. Only then restored variant model-reviewed annotations. All question/answer attestations remained unaffected. No unresolved item-level correction recorded. Independent controller review and human teacher certification remain separate; no UI acceptance claimed.


## Fix round 1

2026-09-09, Codex implementation agent. Independent review Important 1 accepted after source verification: A2/B1 still implied acceptance of the pasta wait after timing.b requested quicker service. Original full-eligibility assertions above are implementation history, not independent gate approval; reviewer withheld restaurant A2/B1 at unit level (23 units / 276 Q / 552 A without Important findings; 2 units / 24 Q / 48 A withheld).

Narrow regression first: portable Node 22 `vitest.mjs run src/content/dialogues/graded/dining-corpus.test.ts -t 'keeps quicker-option'`, 21:58:11: 8 failed / 543 skipped, 2.95s, exit 1. Both extended variants reached the old bread question while timing evidence remained `ask`. Tests pin a specifically read transition payload and preserve timing evidence through both bread choices; they are not a general semantic checker.

Editing state: reset `restaurant-order.A2.bread` and `restaurant-order.B1.bread` plus each `.a`/`.b` to draft through their explicit row annotation. Draft items 2 Q / 4 A; whole-unit eligibility remains withheld for those 2 units during editing. Rewrote their questions/hints and A2.a/A2.b/B1.b answers; B1.a unchanged but included in paired rereading. Post-edit reading and final counts follow.

Actual post-edit reading: reopened both timing/bread/cutlery source blocks and the two extended path arrays. Read changed bread question, hint and both owned answers item by item: `restaurant-order.A2.bread`, `.a`, `.b`; `restaurant-order.B1.bread`, `.a`, `.b` (2 Q / 4 A), plus contextual timing/cutlery pairs in both levels (4 Q / 8 A). Considered both timing.a acceptance and timing.b quicker-option request through visit/planning extended order. New bread questions leave timing under discussion; neither affirmative nor negative bread answer accepts a pasta wait or withdraws the quicker request. A2 uses a direct short yes/no preference; B1 gives a hunger/appetite reason referring to the meal, not a promised pasta service. No fact effect, ID, objective, path or version changed. Only after this read were the two row attestations restored to model-reviewed.

Current implementation editorial eligibility: all 25 units / 300 Q / 600 A, 0 draft after re-attestation; affected 2 units again have 12 Q / 24 A each under the implementation gate. Actual changed English: 2 Q / 3 A (B1.a unchanged), plus 2 Chinese hints. Human reads remain 0; analyses unchanged. Independent eligibility is still the prior verdict (23 units / 276 Q / 552 A with no Important finding, 2 units withheld) until controller-owned scoped re-review. This ledger does not declare the batch independently approved. Minor C1 polish remains Task 3I; no line-ending cleanup.

Fix verification: narrow GREEN 22:00:37, 8 passed / 543 skipped, 2.90s; final dining-corpus.test.ts 22:00:43, 551 passed, 6.90s, exit0. Portable Node22 typecheck and ESLint on the two changed TS files exit0, no diagnostics. Git diff check exit0 with LF→CRLF notices (not warning-free). No full suite or unrelated coffee-analysis rerun; original953full tests below are historical. Final diff reread confirms only the two bread question/pairs and narrow tests changed; no contract or analysis changes. Controller scoped re-review pending.

## Complete item identifier inventory

Final verification2026-09-09: portable Node22, focused545passed; typecheck/changed-file lint/diff check exit0. One full-suite run after self-review:51files/953tests passed,21:37:03,duration66.10s,exit0. New category alone543tests. New batch25units/300Q/600A; all authored, structurally passing and model-read/eligible;0draft,0human. Existing pilot separately5units/60Q/120A, so dining total30units/360Q/720A. Analysis15entries/75examples/75substitutions, all model-read/eligible,0human. Tests establish structural behavior, not language certification.

This is a mechanical expansion of the already-read ledger above, not an automated reading or certification. Each row lists the actual question and both owned answers reviewed by the named reader.

| Question | Answer A | Answer B |
|---|---|---|
| restaurant-order.A1.meal | restaurant-order.A1.meal.a | restaurant-order.A1.meal.b |
| restaurant-order.A1.portion | restaurant-order.A1.portion.a | restaurant-order.A1.portion.b |
| restaurant-order.A1.drink | restaurant-order.A1.drink.a | restaurant-order.A1.drink.b |
| restaurant-order.A1.chilli | restaurant-order.A1.chilli.a | restaurant-order.A1.chilli.b |
| restaurant-order.A1.side | restaurant-order.A1.side.a | restaurant-order.A1.side.b |
| restaurant-order.A1.timing | restaurant-order.A1.timing.a | restaurant-order.A1.timing.b |
| restaurant-order.A1.bread | restaurant-order.A1.bread.a | restaurant-order.A1.bread.b |
| restaurant-order.A1.cutlery | restaurant-order.A1.cutlery.a | restaurant-order.A1.cutlery.b |
| restaurant-order.A1.bill | restaurant-order.A1.bill.a | restaurant-order.A1.bill.b |
| restaurant-order.A1.payment | restaurant-order.A1.payment.a | restaurant-order.A1.payment.b |
| restaurant-order.A1.seat | restaurant-order.A1.seat.a | restaurant-order.A1.seat.b |
| restaurant-order.A1.purpose | restaurant-order.A1.purpose.a | restaurant-order.A1.purpose.b |
| restaurant-order.A2.meal | restaurant-order.A2.meal.a | restaurant-order.A2.meal.b |
| restaurant-order.A2.portion | restaurant-order.A2.portion.a | restaurant-order.A2.portion.b |
| restaurant-order.A2.drink | restaurant-order.A2.drink.a | restaurant-order.A2.drink.b |
| restaurant-order.A2.chilli | restaurant-order.A2.chilli.a | restaurant-order.A2.chilli.b |
| restaurant-order.A2.side | restaurant-order.A2.side.a | restaurant-order.A2.side.b |
| restaurant-order.A2.timing | restaurant-order.A2.timing.a | restaurant-order.A2.timing.b |
| restaurant-order.A2.bread | restaurant-order.A2.bread.a | restaurant-order.A2.bread.b |
| restaurant-order.A2.cutlery | restaurant-order.A2.cutlery.a | restaurant-order.A2.cutlery.b |
| restaurant-order.A2.bill | restaurant-order.A2.bill.a | restaurant-order.A2.bill.b |
| restaurant-order.A2.payment | restaurant-order.A2.payment.a | restaurant-order.A2.payment.b |
| restaurant-order.A2.seat | restaurant-order.A2.seat.a | restaurant-order.A2.seat.b |
| restaurant-order.A2.purpose | restaurant-order.A2.purpose.a | restaurant-order.A2.purpose.b |
| restaurant-order.B1.meal | restaurant-order.B1.meal.a | restaurant-order.B1.meal.b |
| restaurant-order.B1.portion | restaurant-order.B1.portion.a | restaurant-order.B1.portion.b |
| restaurant-order.B1.drink | restaurant-order.B1.drink.a | restaurant-order.B1.drink.b |
| restaurant-order.B1.chilli | restaurant-order.B1.chilli.a | restaurant-order.B1.chilli.b |
| restaurant-order.B1.side | restaurant-order.B1.side.a | restaurant-order.B1.side.b |
| restaurant-order.B1.timing | restaurant-order.B1.timing.a | restaurant-order.B1.timing.b |
| restaurant-order.B1.bread | restaurant-order.B1.bread.a | restaurant-order.B1.bread.b |
| restaurant-order.B1.cutlery | restaurant-order.B1.cutlery.a | restaurant-order.B1.cutlery.b |
| restaurant-order.B1.bill | restaurant-order.B1.bill.a | restaurant-order.B1.bill.b |
| restaurant-order.B1.payment | restaurant-order.B1.payment.a | restaurant-order.B1.payment.b |
| restaurant-order.B1.seat | restaurant-order.B1.seat.a | restaurant-order.B1.seat.b |
| restaurant-order.B1.purpose | restaurant-order.B1.purpose.a | restaurant-order.B1.purpose.b |
| restaurant-order.B2.meal | restaurant-order.B2.meal.a | restaurant-order.B2.meal.b |
| restaurant-order.B2.portion | restaurant-order.B2.portion.a | restaurant-order.B2.portion.b |
| restaurant-order.B2.drink | restaurant-order.B2.drink.a | restaurant-order.B2.drink.b |
| restaurant-order.B2.chilli | restaurant-order.B2.chilli.a | restaurant-order.B2.chilli.b |
| restaurant-order.B2.side | restaurant-order.B2.side.a | restaurant-order.B2.side.b |
| restaurant-order.B2.timing | restaurant-order.B2.timing.a | restaurant-order.B2.timing.b |
| restaurant-order.B2.bread | restaurant-order.B2.bread.a | restaurant-order.B2.bread.b |
| restaurant-order.B2.cutlery | restaurant-order.B2.cutlery.a | restaurant-order.B2.cutlery.b |
| restaurant-order.B2.bill | restaurant-order.B2.bill.a | restaurant-order.B2.bill.b |
| restaurant-order.B2.payment | restaurant-order.B2.payment.a | restaurant-order.B2.payment.b |
| restaurant-order.B2.seat | restaurant-order.B2.seat.a | restaurant-order.B2.seat.b |
| restaurant-order.B2.purpose | restaurant-order.B2.purpose.a | restaurant-order.B2.purpose.b |
| restaurant-order.C1.meal | restaurant-order.C1.meal.a | restaurant-order.C1.meal.b |
| restaurant-order.C1.portion | restaurant-order.C1.portion.a | restaurant-order.C1.portion.b |
| restaurant-order.C1.drink | restaurant-order.C1.drink.a | restaurant-order.C1.drink.b |
| restaurant-order.C1.chilli | restaurant-order.C1.chilli.a | restaurant-order.C1.chilli.b |
| restaurant-order.C1.side | restaurant-order.C1.side.a | restaurant-order.C1.side.b |
| restaurant-order.C1.timing | restaurant-order.C1.timing.a | restaurant-order.C1.timing.b |
| restaurant-order.C1.bread | restaurant-order.C1.bread.a | restaurant-order.C1.bread.b |
| restaurant-order.C1.cutlery | restaurant-order.C1.cutlery.a | restaurant-order.C1.cutlery.b |
| restaurant-order.C1.bill | restaurant-order.C1.bill.a | restaurant-order.C1.bill.b |
| restaurant-order.C1.payment | restaurant-order.C1.payment.a | restaurant-order.C1.payment.b |
| restaurant-order.C1.seat | restaurant-order.C1.seat.a | restaurant-order.C1.seat.b |
| restaurant-order.C1.purpose | restaurant-order.C1.purpose.a | restaurant-order.C1.purpose.b |
| food-allergy.A1.allergen | food-allergy.A1.allergen.a | food-allergy.A1.allergen.b |
| food-allergy.A1.food | food-allergy.A1.food.a | food-allergy.A1.food.b |
| food-allergy.A1.check | food-allergy.A1.check.a | food-allergy.A1.check.b |
| food-allergy.A1.extras | food-allergy.A1.extras.a | food-allergy.A1.extras.b |
| food-allergy.A1.preparation | food-allergy.A1.preparation.a | food-allergy.A1.preparation.b |
| food-allergy.A1.uncertainty | food-allergy.A1.uncertainty.a | food-allergy.A1.uncertainty.b |
| food-allergy.A1.format | food-allergy.A1.format.a | food-allergy.A1.format.b |
| food-allergy.A1.card | food-allergy.A1.card.a | food-allergy.A1.card.b |
| food-allergy.A1.record | food-allergy.A1.record.a | food-allergy.A1.record.b |
| food-allergy.A1.next | food-allergy.A1.next.a | food-allergy.A1.next.b |
| food-allergy.A1.contact | food-allergy.A1.contact.a | food-allergy.A1.contact.b |
| food-allergy.A1.version | food-allergy.A1.version.a | food-allergy.A1.version.b |
| food-allergy.A2.allergen | food-allergy.A2.allergen.a | food-allergy.A2.allergen.b |
| food-allergy.A2.food | food-allergy.A2.food.a | food-allergy.A2.food.b |
| food-allergy.A2.check | food-allergy.A2.check.a | food-allergy.A2.check.b |
| food-allergy.A2.extras | food-allergy.A2.extras.a | food-allergy.A2.extras.b |
| food-allergy.A2.preparation | food-allergy.A2.preparation.a | food-allergy.A2.preparation.b |
| food-allergy.A2.uncertainty | food-allergy.A2.uncertainty.a | food-allergy.A2.uncertainty.b |
| food-allergy.A2.format | food-allergy.A2.format.a | food-allergy.A2.format.b |
| food-allergy.A2.card | food-allergy.A2.card.a | food-allergy.A2.card.b |
| food-allergy.A2.record | food-allergy.A2.record.a | food-allergy.A2.record.b |
| food-allergy.A2.next | food-allergy.A2.next.a | food-allergy.A2.next.b |
| food-allergy.A2.contact | food-allergy.A2.contact.a | food-allergy.A2.contact.b |
| food-allergy.A2.version | food-allergy.A2.version.a | food-allergy.A2.version.b |
| food-allergy.B1.allergen | food-allergy.B1.allergen.a | food-allergy.B1.allergen.b |
| food-allergy.B1.food | food-allergy.B1.food.a | food-allergy.B1.food.b |
| food-allergy.B1.check | food-allergy.B1.check.a | food-allergy.B1.check.b |
| food-allergy.B1.extras | food-allergy.B1.extras.a | food-allergy.B1.extras.b |
| food-allergy.B1.preparation | food-allergy.B1.preparation.a | food-allergy.B1.preparation.b |
| food-allergy.B1.uncertainty | food-allergy.B1.uncertainty.a | food-allergy.B1.uncertainty.b |
| food-allergy.B1.format | food-allergy.B1.format.a | food-allergy.B1.format.b |
| food-allergy.B1.card | food-allergy.B1.card.a | food-allergy.B1.card.b |
| food-allergy.B1.record | food-allergy.B1.record.a | food-allergy.B1.record.b |
| food-allergy.B1.next | food-allergy.B1.next.a | food-allergy.B1.next.b |
| food-allergy.B1.contact | food-allergy.B1.contact.a | food-allergy.B1.contact.b |
| food-allergy.B1.version | food-allergy.B1.version.a | food-allergy.B1.version.b |
| food-allergy.B2.allergen | food-allergy.B2.allergen.a | food-allergy.B2.allergen.b |
| food-allergy.B2.food | food-allergy.B2.food.a | food-allergy.B2.food.b |
| food-allergy.B2.check | food-allergy.B2.check.a | food-allergy.B2.check.b |
| food-allergy.B2.extras | food-allergy.B2.extras.a | food-allergy.B2.extras.b |
| food-allergy.B2.preparation | food-allergy.B2.preparation.a | food-allergy.B2.preparation.b |
| food-allergy.B2.uncertainty | food-allergy.B2.uncertainty.a | food-allergy.B2.uncertainty.b |
| food-allergy.B2.format | food-allergy.B2.format.a | food-allergy.B2.format.b |
| food-allergy.B2.card | food-allergy.B2.card.a | food-allergy.B2.card.b |
| food-allergy.B2.record | food-allergy.B2.record.a | food-allergy.B2.record.b |
| food-allergy.B2.next | food-allergy.B2.next.a | food-allergy.B2.next.b |
| food-allergy.B2.contact | food-allergy.B2.contact.a | food-allergy.B2.contact.b |
| food-allergy.B2.version | food-allergy.B2.version.a | food-allergy.B2.version.b |
| food-allergy.C1.allergen | food-allergy.C1.allergen.a | food-allergy.C1.allergen.b |
| food-allergy.C1.food | food-allergy.C1.food.a | food-allergy.C1.food.b |
| food-allergy.C1.check | food-allergy.C1.check.a | food-allergy.C1.check.b |
| food-allergy.C1.extras | food-allergy.C1.extras.a | food-allergy.C1.extras.b |
| food-allergy.C1.preparation | food-allergy.C1.preparation.a | food-allergy.C1.preparation.b |
| food-allergy.C1.uncertainty | food-allergy.C1.uncertainty.a | food-allergy.C1.uncertainty.b |
| food-allergy.C1.format | food-allergy.C1.format.a | food-allergy.C1.format.b |
| food-allergy.C1.card | food-allergy.C1.card.a | food-allergy.C1.card.b |
| food-allergy.C1.record | food-allergy.C1.record.a | food-allergy.C1.record.b |
| food-allergy.C1.next | food-allergy.C1.next.a | food-allergy.C1.next.b |
| food-allergy.C1.contact | food-allergy.C1.contact.a | food-allergy.C1.contact.b |
| food-allergy.C1.version | food-allergy.C1.version.a | food-allergy.C1.version.b |
| return-item.A1.request | return-item.A1.request.a | return-item.A1.request.b |
| return-item.A1.reason | return-item.A1.reason.a | return-item.A1.reason.b |
| return-item.A1.receipt | return-item.A1.receipt.a | return-item.A1.receipt.b |
| return-item.A1.date | return-item.A1.date.a | return-item.A1.date.b |
| return-item.A1.condition | return-item.A1.condition.a | return-item.A1.condition.b |
| return-item.A1.inspection | return-item.A1.inspection.a | return-item.A1.inspection.b |
| return-item.A1.queue | return-item.A1.queue.a | return-item.A1.queue.b |
| return-item.A1.record | return-item.A1.record.a | return-item.A1.record.b |
| return-item.A1.policy | return-item.A1.policy.a | return-item.A1.policy.b |
| return-item.A1.next | return-item.A1.next.a | return-item.A1.next.b |
| return-item.A1.carry | return-item.A1.carry.a | return-item.A1.carry.b |
| return-item.A1.desk | return-item.A1.desk.a | return-item.A1.desk.b |
| return-item.A2.request | return-item.A2.request.a | return-item.A2.request.b |
| return-item.A2.reason | return-item.A2.reason.a | return-item.A2.reason.b |
| return-item.A2.receipt | return-item.A2.receipt.a | return-item.A2.receipt.b |
| return-item.A2.date | return-item.A2.date.a | return-item.A2.date.b |
| return-item.A2.condition | return-item.A2.condition.a | return-item.A2.condition.b |
| return-item.A2.inspection | return-item.A2.inspection.a | return-item.A2.inspection.b |
| return-item.A2.queue | return-item.A2.queue.a | return-item.A2.queue.b |
| return-item.A2.record | return-item.A2.record.a | return-item.A2.record.b |
| return-item.A2.policy | return-item.A2.policy.a | return-item.A2.policy.b |
| return-item.A2.next | return-item.A2.next.a | return-item.A2.next.b |
| return-item.A2.carry | return-item.A2.carry.a | return-item.A2.carry.b |
| return-item.A2.desk | return-item.A2.desk.a | return-item.A2.desk.b |
| return-item.B1.request | return-item.B1.request.a | return-item.B1.request.b |
| return-item.B1.reason | return-item.B1.reason.a | return-item.B1.reason.b |
| return-item.B1.receipt | return-item.B1.receipt.a | return-item.B1.receipt.b |
| return-item.B1.date | return-item.B1.date.a | return-item.B1.date.b |
| return-item.B1.condition | return-item.B1.condition.a | return-item.B1.condition.b |
| return-item.B1.inspection | return-item.B1.inspection.a | return-item.B1.inspection.b |
| return-item.B1.queue | return-item.B1.queue.a | return-item.B1.queue.b |
| return-item.B1.record | return-item.B1.record.a | return-item.B1.record.b |
| return-item.B1.policy | return-item.B1.policy.a | return-item.B1.policy.b |
| return-item.B1.next | return-item.B1.next.a | return-item.B1.next.b |
| return-item.B1.carry | return-item.B1.carry.a | return-item.B1.carry.b |
| return-item.B1.desk | return-item.B1.desk.a | return-item.B1.desk.b |
| return-item.B2.request | return-item.B2.request.a | return-item.B2.request.b |
| return-item.B2.reason | return-item.B2.reason.a | return-item.B2.reason.b |
| return-item.B2.receipt | return-item.B2.receipt.a | return-item.B2.receipt.b |
| return-item.B2.date | return-item.B2.date.a | return-item.B2.date.b |
| return-item.B2.condition | return-item.B2.condition.a | return-item.B2.condition.b |
| return-item.B2.inspection | return-item.B2.inspection.a | return-item.B2.inspection.b |
| return-item.B2.queue | return-item.B2.queue.a | return-item.B2.queue.b |
| return-item.B2.record | return-item.B2.record.a | return-item.B2.record.b |
| return-item.B2.policy | return-item.B2.policy.a | return-item.B2.policy.b |
| return-item.B2.next | return-item.B2.next.a | return-item.B2.next.b |
| return-item.B2.carry | return-item.B2.carry.a | return-item.B2.carry.b |
| return-item.B2.desk | return-item.B2.desk.a | return-item.B2.desk.b |
| return-item.C1.request | return-item.C1.request.a | return-item.C1.request.b |
| return-item.C1.reason | return-item.C1.reason.a | return-item.C1.reason.b |
| return-item.C1.receipt | return-item.C1.receipt.a | return-item.C1.receipt.b |
| return-item.C1.date | return-item.C1.date.a | return-item.C1.date.b |
| return-item.C1.condition | return-item.C1.condition.a | return-item.C1.condition.b |
| return-item.C1.inspection | return-item.C1.inspection.a | return-item.C1.inspection.b |
| return-item.C1.queue | return-item.C1.queue.a | return-item.C1.queue.b |
| return-item.C1.record | return-item.C1.record.a | return-item.C1.record.b |
| return-item.C1.policy | return-item.C1.policy.a | return-item.C1.policy.b |
| return-item.C1.next | return-item.C1.next.a | return-item.C1.next.b |
| return-item.C1.carry | return-item.C1.carry.a | return-item.C1.carry.b |
| return-item.C1.desk | return-item.C1.desk.a | return-item.C1.desk.b |
| supermarket-help.A1.product | supermarket-help.A1.product.a | supermarket-help.A1.product.b |
| supermarket-help.A1.navigation | supermarket-help.A1.navigation.a | supermarket-help.A1.navigation.b |
| supermarket-help.A1.size | supermarket-help.A1.size.a | supermarket-help.A1.size.b |
| supermarket-help.A1.brand | supermarket-help.A1.brand.a | supermarket-help.A1.brand.b |
| supermarket-help.A1.compare | supermarket-help.A1.compare.a | supermarket-help.A1.compare.b |
| supermarket-help.A1.checkout | supermarket-help.A1.checkout.a | supermarket-help.A1.checkout.b |
| supermarket-help.A1.reach | supermarket-help.A1.reach.a | supermarket-help.A1.reach.b |
| supermarket-help.A1.bag | supermarket-help.A1.bag.a | supermarket-help.A1.bag.b |
| supermarket-help.A1.fallback | supermarket-help.A1.fallback.a | supermarket-help.A1.fallback.b |
| supermarket-help.A1.label | supermarket-help.A1.label.a | supermarket-help.A1.label.b |
| supermarket-help.A1.carrier | supermarket-help.A1.carrier.a | supermarket-help.A1.carrier.b |
| supermarket-help.A1.purpose | supermarket-help.A1.purpose.a | supermarket-help.A1.purpose.b |
| supermarket-help.A2.product | supermarket-help.A2.product.a | supermarket-help.A2.product.b |
| supermarket-help.A2.navigation | supermarket-help.A2.navigation.a | supermarket-help.A2.navigation.b |
| supermarket-help.A2.size | supermarket-help.A2.size.a | supermarket-help.A2.size.b |
| supermarket-help.A2.brand | supermarket-help.A2.brand.a | supermarket-help.A2.brand.b |
| supermarket-help.A2.compare | supermarket-help.A2.compare.a | supermarket-help.A2.compare.b |
| supermarket-help.A2.checkout | supermarket-help.A2.checkout.a | supermarket-help.A2.checkout.b |
| supermarket-help.A2.reach | supermarket-help.A2.reach.a | supermarket-help.A2.reach.b |
| supermarket-help.A2.bag | supermarket-help.A2.bag.a | supermarket-help.A2.bag.b |
| supermarket-help.A2.fallback | supermarket-help.A2.fallback.a | supermarket-help.A2.fallback.b |
| supermarket-help.A2.label | supermarket-help.A2.label.a | supermarket-help.A2.label.b |
| supermarket-help.A2.carrier | supermarket-help.A2.carrier.a | supermarket-help.A2.carrier.b |
| supermarket-help.A2.purpose | supermarket-help.A2.purpose.a | supermarket-help.A2.purpose.b |
| supermarket-help.B1.product | supermarket-help.B1.product.a | supermarket-help.B1.product.b |
| supermarket-help.B1.navigation | supermarket-help.B1.navigation.a | supermarket-help.B1.navigation.b |
| supermarket-help.B1.size | supermarket-help.B1.size.a | supermarket-help.B1.size.b |
| supermarket-help.B1.brand | supermarket-help.B1.brand.a | supermarket-help.B1.brand.b |
| supermarket-help.B1.compare | supermarket-help.B1.compare.a | supermarket-help.B1.compare.b |
| supermarket-help.B1.checkout | supermarket-help.B1.checkout.a | supermarket-help.B1.checkout.b |
| supermarket-help.B1.reach | supermarket-help.B1.reach.a | supermarket-help.B1.reach.b |
| supermarket-help.B1.bag | supermarket-help.B1.bag.a | supermarket-help.B1.bag.b |
| supermarket-help.B1.fallback | supermarket-help.B1.fallback.a | supermarket-help.B1.fallback.b |
| supermarket-help.B1.label | supermarket-help.B1.label.a | supermarket-help.B1.label.b |
| supermarket-help.B1.carrier | supermarket-help.B1.carrier.a | supermarket-help.B1.carrier.b |
| supermarket-help.B1.purpose | supermarket-help.B1.purpose.a | supermarket-help.B1.purpose.b |
| supermarket-help.B2.product | supermarket-help.B2.product.a | supermarket-help.B2.product.b |
| supermarket-help.B2.navigation | supermarket-help.B2.navigation.a | supermarket-help.B2.navigation.b |
| supermarket-help.B2.size | supermarket-help.B2.size.a | supermarket-help.B2.size.b |
| supermarket-help.B2.brand | supermarket-help.B2.brand.a | supermarket-help.B2.brand.b |
| supermarket-help.B2.compare | supermarket-help.B2.compare.a | supermarket-help.B2.compare.b |
| supermarket-help.B2.checkout | supermarket-help.B2.checkout.a | supermarket-help.B2.checkout.b |
| supermarket-help.B2.reach | supermarket-help.B2.reach.a | supermarket-help.B2.reach.b |
| supermarket-help.B2.bag | supermarket-help.B2.bag.a | supermarket-help.B2.bag.b |
| supermarket-help.B2.fallback | supermarket-help.B2.fallback.a | supermarket-help.B2.fallback.b |
| supermarket-help.B2.label | supermarket-help.B2.label.a | supermarket-help.B2.label.b |
| supermarket-help.B2.carrier | supermarket-help.B2.carrier.a | supermarket-help.B2.carrier.b |
| supermarket-help.B2.purpose | supermarket-help.B2.purpose.a | supermarket-help.B2.purpose.b |
| supermarket-help.C1.product | supermarket-help.C1.product.a | supermarket-help.C1.product.b |
| supermarket-help.C1.navigation | supermarket-help.C1.navigation.a | supermarket-help.C1.navigation.b |
| supermarket-help.C1.size | supermarket-help.C1.size.a | supermarket-help.C1.size.b |
| supermarket-help.C1.brand | supermarket-help.C1.brand.a | supermarket-help.C1.brand.b |
| supermarket-help.C1.compare | supermarket-help.C1.compare.a | supermarket-help.C1.compare.b |
| supermarket-help.C1.checkout | supermarket-help.C1.checkout.a | supermarket-help.C1.checkout.b |
| supermarket-help.C1.reach | supermarket-help.C1.reach.a | supermarket-help.C1.reach.b |
| supermarket-help.C1.bag | supermarket-help.C1.bag.a | supermarket-help.C1.bag.b |
| supermarket-help.C1.fallback | supermarket-help.C1.fallback.a | supermarket-help.C1.fallback.b |
| supermarket-help.C1.label | supermarket-help.C1.label.a | supermarket-help.C1.label.b |
| supermarket-help.C1.carrier | supermarket-help.C1.carrier.a | supermarket-help.C1.carrier.b |
| supermarket-help.C1.purpose | supermarket-help.C1.purpose.a | supermarket-help.C1.purpose.b |
| price-discount.A1.item | price-discount.A1.item.a | price-discount.A1.item.b |
| price-discount.A1.budget | price-discount.A1.budget.a | price-discount.A1.budget.b |
| price-discount.A1.check | price-discount.A1.check.a | price-discount.A1.check.b |
| price-discount.A1.request | price-discount.A1.request.a | price-discount.A1.request.b |
| price-discount.A1.boundary | price-discount.A1.boundary.a | price-discount.A1.boundary.b |
| price-discount.A1.alternative | price-discount.A1.alternative.a | price-discount.A1.alternative.b |
| price-discount.A1.bundle | price-discount.A1.bundle.a | price-discount.A1.bundle.b |
| price-discount.A1.wrap | price-discount.A1.wrap.a | price-discount.A1.wrap.b |
| price-discount.A1.payment | price-discount.A1.payment.a | price-discount.A1.payment.b |
| price-discount.A1.decision | price-discount.A1.decision.a | price-discount.A1.decision.b |
| price-discount.A1.hold | price-discount.A1.hold.a | price-discount.A1.hold.b |
| price-discount.A1.inspect | price-discount.A1.inspect.a | price-discount.A1.inspect.b |
| price-discount.A2.item | price-discount.A2.item.a | price-discount.A2.item.b |
| price-discount.A2.budget | price-discount.A2.budget.a | price-discount.A2.budget.b |
| price-discount.A2.check | price-discount.A2.check.a | price-discount.A2.check.b |
| price-discount.A2.request | price-discount.A2.request.a | price-discount.A2.request.b |
| price-discount.A2.boundary | price-discount.A2.boundary.a | price-discount.A2.boundary.b |
| price-discount.A2.alternative | price-discount.A2.alternative.a | price-discount.A2.alternative.b |
| price-discount.A2.bundle | price-discount.A2.bundle.a | price-discount.A2.bundle.b |
| price-discount.A2.wrap | price-discount.A2.wrap.a | price-discount.A2.wrap.b |
| price-discount.A2.payment | price-discount.A2.payment.a | price-discount.A2.payment.b |
| price-discount.A2.decision | price-discount.A2.decision.a | price-discount.A2.decision.b |
| price-discount.A2.hold | price-discount.A2.hold.a | price-discount.A2.hold.b |
| price-discount.A2.inspect | price-discount.A2.inspect.a | price-discount.A2.inspect.b |
| price-discount.B1.item | price-discount.B1.item.a | price-discount.B1.item.b |
| price-discount.B1.budget | price-discount.B1.budget.a | price-discount.B1.budget.b |
| price-discount.B1.check | price-discount.B1.check.a | price-discount.B1.check.b |
| price-discount.B1.request | price-discount.B1.request.a | price-discount.B1.request.b |
| price-discount.B1.boundary | price-discount.B1.boundary.a | price-discount.B1.boundary.b |
| price-discount.B1.alternative | price-discount.B1.alternative.a | price-discount.B1.alternative.b |
| price-discount.B1.bundle | price-discount.B1.bundle.a | price-discount.B1.bundle.b |
| price-discount.B1.wrap | price-discount.B1.wrap.a | price-discount.B1.wrap.b |
| price-discount.B1.payment | price-discount.B1.payment.a | price-discount.B1.payment.b |
| price-discount.B1.decision | price-discount.B1.decision.a | price-discount.B1.decision.b |
| price-discount.B1.hold | price-discount.B1.hold.a | price-discount.B1.hold.b |
| price-discount.B1.inspect | price-discount.B1.inspect.a | price-discount.B1.inspect.b |
| price-discount.B2.item | price-discount.B2.item.a | price-discount.B2.item.b |
| price-discount.B2.budget | price-discount.B2.budget.a | price-discount.B2.budget.b |
| price-discount.B2.check | price-discount.B2.check.a | price-discount.B2.check.b |
| price-discount.B2.request | price-discount.B2.request.a | price-discount.B2.request.b |
| price-discount.B2.boundary | price-discount.B2.boundary.a | price-discount.B2.boundary.b |
| price-discount.B2.alternative | price-discount.B2.alternative.a | price-discount.B2.alternative.b |
| price-discount.B2.bundle | price-discount.B2.bundle.a | price-discount.B2.bundle.b |
| price-discount.B2.wrap | price-discount.B2.wrap.a | price-discount.B2.wrap.b |
| price-discount.B2.payment | price-discount.B2.payment.a | price-discount.B2.payment.b |
| price-discount.B2.decision | price-discount.B2.decision.a | price-discount.B2.decision.b |
| price-discount.B2.hold | price-discount.B2.hold.a | price-discount.B2.hold.b |
| price-discount.B2.inspect | price-discount.B2.inspect.a | price-discount.B2.inspect.b |
| price-discount.C1.item | price-discount.C1.item.a | price-discount.C1.item.b |
| price-discount.C1.budget | price-discount.C1.budget.a | price-discount.C1.budget.b |
| price-discount.C1.check | price-discount.C1.check.a | price-discount.C1.check.b |
| price-discount.C1.request | price-discount.C1.request.a | price-discount.C1.request.b |
| price-discount.C1.boundary | price-discount.C1.boundary.a | price-discount.C1.boundary.b |
| price-discount.C1.alternative | price-discount.C1.alternative.a | price-discount.C1.alternative.b |
| price-discount.C1.bundle | price-discount.C1.bundle.a | price-discount.C1.bundle.b |
| price-discount.C1.wrap | price-discount.C1.wrap.a | price-discount.C1.wrap.b |
| price-discount.C1.payment | price-discount.C1.payment.a | price-discount.C1.payment.b |
| price-discount.C1.decision | price-discount.C1.decision.a | price-discount.C1.decision.b |
| price-discount.C1.hold | price-discount.C1.hold.a | price-discount.C1.hold.b |
| price-discount.C1.inspect | price-discount.C1.inspect.a | price-discount.C1.inspect.b |
