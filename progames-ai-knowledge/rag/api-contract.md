# Local API contract

Bind: `127.0.0.1:8765`; Python standard-library development HTTP server, not intended for public production hosting. No authentication because access is localhost only. Do not expose it on a public interface without a production server, access controls, request limits and a security review. API makes no external requests and accepts no file paths.

- `GET /health`: status, number of documents, `generative_model: false`.
- `GET /products`: canonical product records and their provenance/status.
- `GET /search?q=Boxer%20Flash&limit=3`: `status`, query, method, ranked evidence results.
- Query length: 1–500 characters; result limit: 1–10 (default 5). Invalid input: HTTP 400. Unknown route: HTTP 404. Mutating HTTP methods are unsupported (501).

Each result: `id`, `type`, ranking `score`, `source_path`, verbatim `excerpt`, URL `citations`. Empty/restricted/no-match retrieval returns `status: insufficient_evidence` and `results: []`. Restricted requests also receive a reason. `retrieved` means evidence matches lexical terms, not that it answers the entire question. Calling code must verify each generated claim against the actual excerpt.

Example: `curl 'http://127.0.0.1:8765/search?q=Boxer%20Flash&limit=2'`
