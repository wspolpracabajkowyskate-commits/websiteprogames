# Ingestion and update control

1. Obtain official public source snapshot and content hash; record URL and retrieval date.
2. Parse products into the canonical JSON schema; preserve per-field source IDs and locators.
3. Flag contradictions or missing values. Null is unknown, never zero or false.
4. Review material product facts, manufacturers/distributors, technical specifications and assertions manually. Never automatically publish edited marketing claims as verified truth.
5. Run schema validation and `python -m unittest discover -s tests -v`.
6. Merge approved knowledge changes. Retrieval reads canonical files directly; there is no separate index to rebuild.
7. Store dated retrieval and model evaluation results separately. Run optional paid model evaluations only after budget authorization.

The included GitHub Actions workflow is prepared but not uploaded/activated. It runs local tests on changed knowledge/code and PRs or manual dispatch. It does not scrape, contact people, deploy production, modify DNS or invoke paid models. A hosted runner may consume the repository owner's GitHub plan allowance when activated. CI cannot replace human source review. Source-refresh detection and GSC/model scheduling are not implemented.
