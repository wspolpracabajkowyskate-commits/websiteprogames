# Observed local evaluation

See `test-results.json` for dated actual results and single-run timing. Automated tests assert canonical catalog records are returned unchanged with citations, PL/EN normalization, no-citation exclusion, input boundaries, unrelated-query abstention, and fail-closed price/certification/warranty behavior. HTTP checks exercise health, product enumeration, retrieval, abstention, invalid limits and unknown routes using a real ephemeral localhost server.

The exact-name catalog lookup test is a wiring/regression check derived from the same corpus, not a held-out semantic quality benchmark. It cannot substantiate public AI visibility, hallucination rate, end-to-end RAG quality or any vendor comparison. Unknown-field filtering is deliberately conservative and incomplete in natural language; unsupported paraphrases can return context, which must not be mistaken for an answer.

Next evaluation gate before connecting a model: independently authored held-out questions in PL/EN, human-reviewed relevant source IDs and per-claim citation entailment. Measure retrieval recall@k, supported claims, correct abstentions and latency; retain the full response and model version. Mark unexecuted model tests as unexecuted and do not assign zero scores. Fine-tuning remains unjustified without a measured RAG baseline and budget approval.
