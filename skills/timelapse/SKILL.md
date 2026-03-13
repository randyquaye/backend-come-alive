---
name: timelapse
description: "Generate a time-lapse visualization of architecture evolution through git history"
argument-hint: "Optional: number of commits to include (default 15), or 'branch-name'"
disable-model-invocation: true
context: fork
allowed-tools: Bash, Read, Glob, Grep, Write, Agent
---

# Backend Factory - Git History Time-Lapse

Generate a time-lapse visualization showing how your backend architecture evolved commit by commit.

## Step 1: Check Server

```bash
curl -s http://localhost:7777/api/status
```

If the server is not running, tell the user to run `/backend-factory:start` first.

## Step 2: Get Git History

Determine the number of commits from `$ARGUMENTS` (default 15).

```bash
git log --oneline --format='%H|%h|%s|%an|%aI' -${N:-15}
```

## Step 3: Analyze Each Commit

Process commits in **reverse chronological order** (oldest first). For each commit:

1. Create an isolated worktree:
   ```bash
   git worktree add /tmp/factory-timelapse-<hash> <hash> --detach 2>/dev/null
   ```

2. Run analysis:
   ```bash
   node ${CLAUDE_PLUGIN_ROOT}/analysis/analyze.js /tmp/factory-timelapse-<hash>
   ```

3. Clean up immediately:
   ```bash
   git worktree remove /tmp/factory-timelapse-<hash> --force 2>/dev/null
   ```

## Step 4: Build Timelapse Array

Compare each snapshot to the previous one and compute diffs. For each commit, write a brief "factory renovation log" narrative.

## Step 5: POST Timelapse Data

```bash
TMPFILE=$(mktemp /tmp/factory-timelapse-XXXXXX.json)
curl -s -X POST http://localhost:7777/api/timelapse \
  -H "Content-Type: application/json" \
  -d @"$TMPFILE"
rm -f "$TMPFILE"
```

## Step 6: Report

- Time-lapse generated with N snapshots
- Use the timeline slider at http://localhost:7777 to scrub through history
- Press play to auto-advance
- Each snapshot shows the factory at that point in time

## Error Handling

Always clean up worktrees:
```bash
git worktree list | grep factory-timelapse | awk '{print $1}' | xargs -I{} git worktree remove {} --force 2>/dev/null
```
