#!/usr/bin/env python3
"""DIABLOOON Trend-to-Idea Engine — free-first, local, approval-gated."""
from __future__ import annotations
import argparse, csv, json, math, re
from datetime import datetime, timezone
from pathlib import Path

BASE = Path(__file__).resolve().parent
DATA = BASE / "data"
OUT = BASE / "output"
SEEDS = [
    {"trend_topic":"animal rescue adventure","format":"short","views_per_hour":0,"published_at":"","source":"starter seed"},
    {"trend_topic":"funny animal misunderstanding","format":"short","views_per_hour":0,"published_at":"","source":"starter seed"},
    {"trend_topic":"hidden treasure hunt","format":"long","views_per_hour":0,"published_at":"","source":"starter seed"},
    {"trend_topic":"giant fruit mystery","format":"short","views_per_hour":0,"published_at":"","source":"starter seed"},
    {"trend_topic":"teamwork puzzle adventure","format":"long","views_per_hour":0,"published_at":"","source":"starter seed"},
]
MOTIFS = {
    "animal": ("The Tiny Animal Rescue Race", "A brave little animal and two clumsy friends solve a rescue puzzle before sunset."),
    "rescue": ("The Wiggly Rescue Mission", "The friends follow funny clues and discover the safest way to help a stuck forest neighbour."),
    "treasure": ("The Treasure That Sneezed", "A treasure map leads the friends to a mysterious chest that keeps making silly sounds."),
    "fruit": ("The Great Banana Bounce", "A runaway giant banana rolls through the village, leaving a trail of riddles and giggles."),
    "mystery": ("Who Hid the Giggle Bell?", "The friends investigate a missing bell using clues, teamwork and a surprise reveal."),
    "teamwork": ("The Wobbly Bridge Challenge", "Each friend contributes a different skill to cross a silly obstacle together."),
    "funny": ("The Day Everything Hiccupped", "A magical hiccup makes ordinary objects bounce, and the friends must figure out why."),
    "puzzle": ("The Three-Clue Jungle Puzzle", "Three friendly clues help the crew find a lost picnic basket without blaming anyone."),
}
DEFAULT = ("The Moonlight Mango Mix-Up", "A moonlit mango mystery sends the friends on a gentle, funny clue hunt.")

def norm(value):
    return re.sub(r"[^a-z0-9 ]+", " ", str(value).lower()).strip()

def make_idea(topic):
    topic_norm = norm(topic)
    for key, value in MOTIFS.items():
        if key in topic_norm:
            return {"title": value[0], "premise": value[1]}
    return {"title": DEFAULT[0], "premise": DEFAULT[1]}

def freshness(published_at):
    if not published_at:
        return 0.0
    try:
        published = datetime.fromisoformat(published_at.replace("Z", "+00:00"))
        if published.tzinfo is None:
            published = published.replace(tzinfo=timezone.utc)
        age_hours = max(0.0, (datetime.now(timezone.utc) - published.astimezone(timezone.utc)).total_seconds() / 3600)
        return max(0.0, 1.0 - age_hours / 168.0)
    except (ValueError, TypeError):
        return 0.0

def load_rows(path):
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8-sig") as handle:
        return list(csv.DictReader(handle))

def score(row):
    topic = str(row.get("trend_topic", row.get("title", ""))).strip()
    try:
        views_per_hour = max(0.0, float(row.get("views_per_hour") or 0))
    except (TypeError, ValueError):
        views_per_hour = 0.0
    velocity = min(1.0, math.log1p(views_per_hour) / math.log1p(100000))
    age = freshness(row.get("published_at", ""))
    terms = ["animal", "funny", "adventure", "rescue", "treasure", "fruit", "mystery", "teamwork", "puzzle", "cartoon", "kids", "family", "story"]
    fit = min(1.0, sum(term in norm(topic) for term in terms) / 3.0)
    total = 100 * (0.60 * fit + 0.25 * velocity + 0.15 * age)
    return round(total, 1), {"audience_fit_heuristic": round(fit, 2), "velocity_heuristic": round(velocity, 2), "freshness_heuristic": round(age, 2)}

def build_report(rows):
    ranked, seen = [], set()
    for row in rows:
        topic = str(row.get("trend_topic", row.get("title", ""))).strip()
        key = norm(topic)
        if not key or key in seen:
            continue
        seen.add(key)
        value, parts = score(row)
        has_metrics = bool(row.get("views_per_hour")) and bool(row.get("published_at"))
        ranked.append({
            "source_topic": topic,
            "source": row.get("source", "user supplied"),
            "format_suggestion": row.get("format") or "short",
            "heuristic_score": value,
            "confidence": "provisional" if has_metrics else "low — source metrics missing",
            "score_parts": parts,
            "original_concept": make_idea(topic),
            "status": "IDEA ONLY — requires owner review",
            "publish_approved": False,
        })
    ranked.sort(key=lambda item: item["heuristic_score"], reverse=True)
    return {
        "project": "DIABLOOON",
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "mode": "free-first; no paid APIs; no publishing",
        "important_limit": "This engine ranks only rows supplied in trends.csv. It does not fetch live YouTube trends or verify demand by itself.",
        "ranked_opportunities": ranked,
    }

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", default=str(DATA / "trends.csv"))
    parser.add_argument("--output", default=str(OUT / "idea_report.json"))
    args = parser.parse_args()
    rows = load_rows(Path(args.input)) or SEEDS
    report = build_report(rows)
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {len(report['ranked_opportunities'])} ranked ideas to {output}")
    print("Live source connected: NO")
    print("Publishing: DISABLED")
    print("Paid API calls: DISABLED")

if __name__ == "__main__":
    main()
