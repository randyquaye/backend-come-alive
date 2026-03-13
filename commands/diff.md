---
description: "Compare architecture between two git commits or branches and visualize the differences"
argument-hint: "Two refs, e.g. 'main feature/auth' or 'abc123 def456'"
allowed-tools: ["Bash", "Read", "Glob", "Grep", "Write", "Agent"]
---

# Backend Factory - Diff

Compare the backend architecture at two git refs and visualize what changed — like a factory renovation blueprint.

## Step 1: Check Server

```bash
curl -s http://localhost:7777/api/status
```

If the server is not running, tell the user to run `/factory-start` first.

## Step 2: Parse Refs

Parse two git refs from `$ARGUMENTS`:
- If two refs are provided (space-separated), use them as `REF_OLD` and `REF_NEW`
- If one ref is provided, use it as `REF_OLD` and `HEAD` as `REF_NEW`
- If no arguments are provided, default to `REF_OLD=HEAD~1` and `REF_NEW=HEAD`

Validate both refs exist:

```bash
git rev-parse --verify "$REF_OLD" && git rev-parse --verify "$REF_NEW"
```

If either ref is invalid, report the error and stop.

## Step 3: Analyze Both States

For each ref, extract the project state and run the analysis script. Use `git show` to avoid destructive checkouts:

### Option A: Use git stash + checkout (if analysis script needs filesystem)

```bash
# Save current state
ORIGINAL_BRANCH=$(git rev-parse --abbrev-ref HEAD)
git stash push -m "factory-diff-temp" 2>/dev/null

# Analyze OLD ref
git checkout "$REF_OLD" --quiet
TMPFILE_OLD=$(mktemp /tmp/factory-diff-old-XXXXXX.json)
node ~/.claude/skills/backend-factory/analysis/analyze.js . > "$TMPFILE_OLD"

# Analyze NEW ref
git checkout "$REF_NEW" --quiet
TMPFILE_NEW=$(mktemp /tmp/factory-diff-new-XXXXXX.json)
node ~/.claude/skills/backend-factory/analysis/analyze.js . > "$TMPFILE_NEW"

# Restore original state
git checkout "$ORIGINAL_BRANCH" --quiet
git stash pop 2>/dev/null
```

### Option B: Use git show (if files can be analyzed individually)

For each ref, use `git show <ref>:<file>` to read source files without switching branches, then run analysis on reconstructed file trees in a temp directory.

## Step 4: Compare Architectures

Read both JSON files and produce a diff by comparing nodes, edges, and actions.

### Node Comparison

For every node, match by `id` across old and new:

- **Added nodes**: present in `TMPFILE_NEW` but not in `TMPFILE_OLD`. Set `diff_status: "added"`.
- **Removed nodes**: present in `TMPFILE_OLD` but not in `TMPFILE_NEW`. Set `diff_status: "removed"`.
- **Modified nodes**: present in both but with differences in `metadata`, `type`, `name`, or connections. Set `diff_status: "modified"`. Include a `diff_changes` array listing what changed (e.g., `["metadata.description changed", "new middleware added to chain"]`).
- **Unchanged nodes**: identical in both. Set `diff_status: "unchanged"`.

### Edge Comparison

Compare edges (connections between nodes):
- Added edges: new connections between stations
- Removed edges: old connections that no longer exist

### Action Comparison

Compare actions (route flows, worker flows, etc.):
- Added actions: new routes, workers, cron jobs, etc.
- Removed actions: deleted routes, workers, cron jobs, etc.
- Modified actions: same action ID but different `flow` array, `flowDescriptions`, or metadata

## Step 5: Build Diff Architecture JSON

Construct a combined architecture JSON that includes ALL nodes from both states:

```json
{
  "nodes": [
    {
      "id": "route-post--users",
      "name": "POST /users",
      "type": "route",
      "diff_status": "added",
      "metadata": {
        "description": "Brand new user registration endpoint",
        "scenario": "db-insert"
      }
    },
    {
      "id": "mw-old-validator",
      "name": "Legacy Validator",
      "type": "middleware",
      "diff_status": "removed",
      "metadata": {
        "description": "Old validation middleware — being decommissioned",
        "scenario": "validate-pass"
      }
    },
    {
      "id": "route-get--detections",
      "name": "GET /detections",
      "type": "route",
      "diff_status": "modified",
      "diff_changes": ["Added pagination support", "New cache layer added to flow"],
      "metadata": {
        "description": "List detections — now with pagination and caching",
        "scenario": "db-select"
      }
    }
  ],
  "edges": [],
  "actions": [],
  "diff_summary": {
    "old_ref": "main",
    "new_ref": "feature/auth",
    "added_count": 3,
    "removed_count": 1,
    "modified_count": 5,
    "unchanged_count": 12,
    "added_nodes": ["route-post--users", "mw-rate-limit-v2", "cache-redis"],
    "removed_nodes": ["mw-old-validator"],
    "modified_nodes": ["route-get--detections", "mw-auth", "db-drizzle"],
    "added_edges": [],
    "removed_edges": [],
    "added_actions": [],
    "removed_actions": [],
    "modified_actions": []
  }
}
```

Enrich ALL nodes (added, removed, modified, unchanged) with full metadata following the same enrichment rules from `/factory-start` and `/factory-analyze`:
- `metadata.description` and `metadata.scenario` on every node
- `metadata.factoryRole` on middleware nodes
- `metadata.stationLabel` on database, cache, and queue nodes
- Full `context`, `flowDescriptions`, and `characterType` on actions

## Step 6: POST to Factory Server

```bash
TMPFILE_DIFF=$(mktemp /tmp/factory-diff-XXXXXX.json)
# Write the diff architecture JSON to the file
curl -s -X POST http://localhost:7777/api/architecture \
  -H "Content-Type: application/json" \
  -d @"$TMPFILE_DIFF"
rm -f "$TMPFILE_OLD" "$TMPFILE_NEW" "$TMPFILE_DIFF"
```

## Step 7: Factory Renovation Report

Report the diff to the user with a creative "factory renovation report" narration. Structure it like an official renovation announcement:

### Narration Style

**Added nodes** — "New departments have been constructed on the factory floor":
- "A brand new **User Registration** department (POST /users) has been built in the east wing, complete with its own validation station and database conveyor."
- "The **Redis Speed Depot** cache station has been installed to turbocharge data retrieval."

**Removed nodes** — "The following departments have been demolished and cleared":
- "The old **Legacy Validator** checkpoint has been torn down. Workers no longer need to stop there — good riddance to the paperwork!"
- "The **XML Parser** station has been decommissioned. The factory has gone fully JSON."

**Modified nodes** — "The following departments have been renovated":
- "The **GET /detections** department got a major upgrade — they installed pagination machinery and a new cache pipeline. Throughput should improve dramatically."
- "**Auth Middleware** security checkpoint has been reinforced — now supports API key authentication alongside JWT tokens."

### Summary Format

```
╔══════════════════════════════════════════════╗
║        🏭 FACTORY RENOVATION REPORT          ║
║        {REF_OLD} → {REF_NEW}                 ║
╠══════════════════════════════════════════════╣
║  🆕 New departments:     {added_count}       ║
║  🗑️  Demolished:          {removed_count}     ║
║  🔧 Renovated:           {modified_count}    ║
║  ✅ Unchanged:           {unchanged_count}   ║
╚══════════════════════════════════════════════╝
```

Then list each category with the creative narration above.

End with:
- The factory visualization at http://localhost:7777 now shows the diff view
- Added stations glow green, removed stations are grayed out / crossed, modified stations pulse yellow
- Hover over any station to see what changed in the diff
- Mention available commands: `/factory-start`, `/factory-analyze`, `/factory-simulate`
