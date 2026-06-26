# ML retraining loop

How a single correction from an admin becomes a smarter model.

## Flow

```
admin sees a wrong match
   │
   ▼
<BreedIdentifier /> or <SmartScanner />
   │
   ▼ "Mark as: <other goat>"  or  "Merge duplicates"
   │
   ▼
POST /api/corrections
{ correction_type, source_goat_id, target_goat_id, notes }
   │
   ▼
INSERT INTO corrections (…)
   │
   ▼ (nightly, or manual "Train AI")
ml_service/retrain_from_corrections.py
   │
   ▼ exports every (goat, photo) pair from every user
   ▼ augments with the new correction as an extra triplet
   │
   ▼
ResNet50 + triplet loss (50 epochs)
   │
   ▼
weights persisted to disk → resnet50-finetuned.pt
   │
   ▼
next /api/smart-scan request uses the new weights
```

## Triplet construction

For each training step, sample:
- **Anchor** — a photo of goat A
- **Positive** — a different photo of goat A
- **Negative** — a photo of goat B (any other goat, weighted toward the ones in `corrections`)

Corrections become **hard negatives** — they over-sample triplets that the model previously got wrong.

## Cadence

- **Manual** — admin clicks "Train AI" in Settings → AI Training
- **Auto** — every N corrections (TBD) trigger an automatic retrain via a Vercel cron

## Eval

The ML service keeps a held-out 10 % of (goat, photo) pairs and reports top-1 / top-5 accuracy on `/train/status`. The UI surfaces "Final loss: 0.034 (28 s)" in the training result panel.

## When NOT to retrain

- Less than 2 goats enrolled → button is disabled
- Less than 3 photos per goat → button is disabled
- A retrain finished in the last 30 min → wait
