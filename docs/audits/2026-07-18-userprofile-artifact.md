# `%USERPROFILE%` repository artifact audit

Date: 2026-07-18  
Branch base: `070a8e2c44770bfcabc41a3bfc614cd04a3b904a`

## Finding

The tracked path `%USERPROFILE%/.gemini/mcp_data.db` is a generated path
artifact, not application data:

- the literal `%USERPROFILE%` directory name proves the Windows home variable
  was not expanded before a Gemini/MCP process constructed its state path;
- the file size is `0` bytes, so it has no SQLite header or records;
- its SHA-256 is
  `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`,
  the standard hash of an empty file;
- `public/.nojekyll` has the same byte length and SHA-256, proving the tracked
  payload is only a duplicate empty-file value rather than unique state; and
- a search across every tracked file outside the anomalous tree found zero
  references to `%USERPROFILE%`, `mcp_data.db`, or `.gemini`.

The real user-home candidate `C:\Users\akgul\.gemini\mcp_data.db` was absent
at audit time. No EconMap route, build step, data pipeline, API, test, workflow,
or documentation consumes this path.

## Method

The audit enumerated `git ls-files -z`, hashed each tracked file with SHA-256,
compared matching hashes, and searched decoded tracked content for each path
token. Results:

| Check | Result |
| --- | --- |
| Anomalous file size | `0` bytes |
| Anomalous file SHA-256 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| Same-hash tracked files | `%USERPROFILE%/.gemini/mcp_data.db`, `public/.nojekyll` |
| `%USERPROFILE%` references outside tree | `0` |
| `mcp_data.db` references outside tree | `0` |
| `.gemini` references outside tree | `0` |

## Decision

Delete the anomalous tree and ignore a future repository-root
`/%USERPROFILE%/` path. Keep `public/.nojekyll`; it is an intentional GitHub
Pages sentinel. This change does not touch generated map artifacts or source
data.
