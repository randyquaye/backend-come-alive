---
name: export
description: "Export the current factory architecture as JSON, HTML snapshot, or Mermaid diagram"
argument-hint: "Format: 'json', 'html', or 'mermaid' (default: json)"
disable-model-invocation: true
allowed-tools: Bash, Read, Write
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
2. Read the visualization files from `${CLAUDE_PLUGIN_ROOT}/visualization/` (index.html, factory.js, characters.js, styles.css)
3. Create a single self-contained HTML file with the architecture JSON embedded inline
4. Write it to `./factory-snapshot.html`

Tell the user: "Standalone factory snapshot exported to `./factory-snapshot.html` — open it in any browser."

## Mermaid Export

If `$ARGUMENTS` contains "mermaid":

```bash
curl -s http://localhost:7777/api/export/mermaid > ./factory-architecture.mmd
```

Tell the user: "Mermaid diagram exported to `./factory-architecture.mmd` — paste into any Mermaid renderer or GitHub markdown."

Note: You can also use the "EXPORT MERMAID" button in the visualization UI to copy the diagram to clipboard.
