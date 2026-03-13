---
description: "Export the current factory architecture as JSON, or generate a static HTML snapshot"
argument-hint: "Format: 'json' or 'html' (default: json)"
allowed-tools: ["Bash", "Read", "Write"]
---

# Backend Factory - Export

Export the current architecture data or a standalone visualization snapshot.

## JSON Export (default)

If `$ARGUMENTS` is empty or "json":

```bash
curl -s http://localhost:7777/api/architecture | jq '.' > ./factory-architecture.json
```

Tell the user: "Architecture exported to `./factory-architecture.json`"

## HTML Export

If `$ARGUMENTS` contains "html":

1. Fetch current architecture data
2. Read the visualization files (index.html, factory.js, characters.js, styles.css)
3. Create a single self-contained HTML file with the architecture JSON embedded inline
4. Write it to `./factory-snapshot.html`

Tell the user: "Standalone factory snapshot exported to `./factory-snapshot.html` — open it in any browser."
