# DIABLOOON Trend-to-Idea Engine (prototype)

A free-first, local Python prototype that ranks supplied topic observations and turns broad themes into original children's story concepts.

## Status
- Implemented: local ranking, simple audience-fit/velocity/freshness heuristics, deduplication, original concept generation, JSON report.
- Not implemented: live YouTube trend ingestion, verified search-volume metrics, video rendering integration, YouTube upload integration.
- Publishing is intentionally absent. Every result is marked `publish_approved: false`.
- No paid API calls or credit-consuming integrations are used by this prototype.

## Run
Requires Python 3.10+ and no third-party packages.

```bash
python tools/diablooon-idea-engine/idea_engine.py
```

Output is written to `tools/diablooon-idea-engine/output/idea_report.json`. The output folder is created automatically.

## Add observations
Edit `data/trends.csv` with columns:
- `trend_topic`: broad topic or audience interest
- `format`: `short` or `long`
- `views_per_hour`: source-reported value if available
- `published_at`: ISO timestamp, for example `2026-10-22T14:30:00Z`
- `source`: source name or `manual seed`

Missing metrics lower confidence; the heuristic score is not a forecast. The starter rows are examples, not live trends.

## Verify
```bash
python -m py_compile tools/diablooon-idea-engine/idea_engine.py
python tools/diablooon-idea-engine/idea_engine.py
```

Confirm the report says live source is not connected and all ideas have `publish_approved: false`.
