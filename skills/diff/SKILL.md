---
name: diff
description: "Compare architecture between two git commits or branches and visualize the differences"
argument-hint: "Two refs, e.g. 'main feature/auth' or 'abc123 def456'"
disable-model-invocation: true
context: fork
allowed-tools: Bash, Read, Glob, Grep, Write, Agent
---

# Backend Factory - Diff

Compare the backend architecture at two git refs and visualize what changed — like a factory renovation blueprint.

## Step 1: Check Server

```bash
curl -s http://localhost:7777/api/status
```

If the server is not running, tell the user to run `/backend-factory:start` first.

## Step 2: Parse Refs

Parse two git refs from `$ARGUMENTS`:
- If two refs are provided (space-separated), use them as `REF_OLD` and `REF_NEW`
- If one ref is provided, use it as `REF_OLD` and `HEAD` as `REF_NEW`
- If no arguments are provided, default to `REF_OLD=HEAD~1` and `REF_NEW=HEAD`

Validate both refs exist:

```bash
git rev-parse --verify "$REF_OLD" && git rev-parse --verify "$REF_NEW"
```

## Step 3: Analyze Both States

For each ref, extract the project state and run the analysis script. Use `git worktree` to avoid destructive checkouts:

```bash
# Analyze OLD ref
git worktree add /tmp/factory-diff-old-$$ "$REF_OLD" --detach 2>/dev/null
TMPFILE_OLD=$(mktemp /tmp/factory-diff-old-XXXXXX.json)
node ${CLAUDE_PLUGIN_ROOT}/analysis/analyze.js /tmp/factory-diff-old-$$ > "$TMPFILE_OLD"
git worktree remove /tmp/factory-diff-old-$$ --force 2>/dev/null

# Analyze NEW ref
git worktree add /tmp/factory-diff-new-$$ "$REF_NEW" --detach 2>/dev/null
TMPFILE_NEW=$(mktemp /tmp/factory-diff-new-XXXXXX.json)
node ${CLAUDE_PLUGIN_ROOT}/analysis/analyze.js /tmp/factory-diff-new-$$ > "$TMPFILE_NEW"
git worktree remove /tmp/factory-diff-new-$$ --force 2>/dev/null
```

## Step 4: Compare Architectures

Read both JSON files and produce a diff by comparing nodes, edges, and actions.

### Node Comparison

For every node, match by `id` across old and new:

- **Added nodes**: present in new but not old. Set `diff_status: "added"`.
- **Removed nodes**: present in old but not new. Set `diff_status: "removed"`.
- **Modified nodes**: present in both with differences. Set `diff_status: "modified"`. Include `diff_changes` array.
- **Unchanged nodes**: identical in both. Set `diff_status: "unchanged"`.

### Edge Comparison

Compare edges (connections between nodes):
- Added edges: new connections
- Removed edges: old connections that no longer exist

### Action Comparison

Compare actions (route flows, worker flows, etc.):
- Added, removed, and modified actions

## Step 5: Build Diff Architecture JSON

Construct a combined architecture JSON with ALL nodes from both states, each annotated with `diff_status`. Enrich ALL nodes with full metadata following the same enrichment rules from `/backend-factory:start` and `/backend-factory:analyze`.

Add a `diff_summary` top-level field with counts and lists.

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

Report the diff with a creative "factory renovation report" narration:

- **Added nodes** — "New departments have been constructed on the factory floor"
- **Removed nodes** — "The following departments have been demolished and cleared"
- **Modified nodes** — "The following departments have been renovated"

End with:
- The factory visualization at http://localhost:7777 now shows the diff view
- Added stations glow green, removed stations are grayed out, modified stations pulse yellow
- Available commands: `/backend-factory:start`, `/backend-factory:analyze`, `/backend-factory:simulate`
