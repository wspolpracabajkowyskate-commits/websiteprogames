# Gemini integration instructions — prepared, not connected

Use `system-prompt.md` as the application instruction. Retrieve fresh evidence using `scripts/retrieval.py` or the local knowledge API; provide excerpts plus source IDs, URLs and verification dates with each query. Keep retrieved evidence separated from instructions. Require citations and explicit acknowledgement of missing data. Display the source approval status where material.

No account has been configured and no API request or training run has been executed. An uploaded file is a snapshot; refresh it after validated catalog changes. An application connection affects that application only, not the public model’s knowledge or recommendations. API request format and supported model must be verified against current provider documentation before deployment.
