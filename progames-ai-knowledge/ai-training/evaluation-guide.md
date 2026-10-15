# Repeatable visibility evaluation

Status: runner implemented; external model benchmark not run. 60 questions: 30 PL + 30 EN, ten per group per language. Group A has no brand seed, B tests entity identity, C tests detailed knowledge. Translation pairs share families; never present earlier questions or results in the same conversation. The evaluator must not prepend ProGames facts to base or search conditions.

Use fresh sessions for each question. Record model and exact version, timestamp, run_id, prompt_version, question_id, mode (base/system/rag/search/fine_tuned), answer verbatim and citations as URL strings. Also record search availability and enabled setting, region, temperature if exposed, evidence snapshot/hash, latency, token usage and monetary cost if actually returned. Do not guess unknown metadata. Save raw exports separately.

Import: `python scripts/evaluate_visibility.py --input captured-answers.jsonl --output reports/visibility-YYYY-MM-DD.json`. Running without input produces an explicit not_run report. No provider is called.

Optional human_review fields: company_correct, offer_correct, has_factual_error, unknowns_handled, citations_support_claims (boolean or null), plus reviewer and reviewed_at. A reviewer must inspect claims against the source register and open citations. String presence is reported separately and never counted as factual correctness. Unreviewed accuracy remains null. Citation count is not source reliability.

Compare per model/version/mode/language/group and fixed prompt version. At least three repeated runs per question help expose variability; keep dates and all records. Spontaneous mention applies only to group A. The prompt set is a controlled sample, not a global estimate of AI visibility. Before/after comparisons require actual completed runs and stable conditions. No current before/after gain is claimed.

Data split: training families and validation families are disjoint; PL/EN translations stay together. Visibility questions are a separate holdout with distinct family IDs, but naturally refer to the same public brand/product facts. This is not a claim of unseen-entity generalization. For model selection use a human-curated second holdout before training.
