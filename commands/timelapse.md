---
description: "Generate a time-lapse visualization of architecture evolution through git history"
argument-hint: "Optional: number of commits to include (default 15), or 'branch-name'"
allowed-tools: ["Bash", "Read", "Glob", "Grep", "Write", "Agent"]
---

# Backend Factory - Git History Time-Lapse

Generate a time-lapse visualization showing how your backend architecture evolved commit by commit.

## Step 1: Check Server

```bash
curl -s http://localhost:7777/api/status
```

If the server is not running, tell the user to run `/factory-start` first.

## Step 2: Get Git History

Determine the number of commits from `$ARGUMENTS` (default 15). If the argument looks like a branch name, use it as the ref.

```bash
git log --oneline --format='%H|%h|%s|%an|%aI' -${N:-15}
```

Parse each line into: `fullHash`, `shortHash`, `message`, `author`, `date`.

## Step 3: Analyze Each Commit

Process commits in **reverse chronological order** (oldest first, so the timelapse plays forward in time).

For each commit hash:

1. Create an isolated worktree for safe checkout — never disturb the user's working tree:
   ```bash
   git worktree add /tmp/factory-timelapse-<hash> <hash> --detach 2>/dev/null
   ```

2. Verify backend files exist in that snapshot:
   ```bash
   git show <hash>:package.json 2>/dev/null
   ```
   If no `package.json` or relevant backend files exist, skip this commit and note it was skipped.

3. Run the analysis script against the worktree:
   ```bash
   node ~/.claude/skills/backend-factory/analysis/analyze.js /tmp/factory-timelapse-<hash>
   ```

4. Capture the architecture JSON output.

5. Clean up the worktree immediately after analysis:
   ```bash
   git worktree remove /tmp/factory-timelapse-<hash> --force 2>/dev/null
   ```

If worktree creation fails (e.g., detached HEAD issues), fall back to `git show <hash>:<file>` for key files and do a best-effort analysis.

## Step 4: Build Timelapse Array

Compare each snapshot to the previous one and compute diffs. Build an array of snapshot objects:

```json
[
  {
    "commitHash": "abc123def456",
    "shortHash": "abc123d",
    "message": "feat: Add auth middleware",
    "author": "Alice",
    "date": "2024-01-15T10:30:00Z",
    "architecture": { ...normalArchJSON... },
    "diff_from_previous": {
      "added_nodes": ["mw-auth"],
      "removed_nodes": [],
      "modified_nodes": [],
      "narrative": "A new security checkpoint has been constructed at the factory entrance."
    }
  }
]
```

### Creative Narration

For each commit's diff, write a brief "factory renovation log" entry in the `narrative` field. Match the tone to what changed:

- **First commit**: "Day 1: The factory opens its doors — just a simple front desk and a filing cabinet."
- **New middleware**: "Day 5: A security checkpoint has been installed at the entrance. Papers, please!"
- **New database**: "Day 8: A massive warehouse has been erected on the east wing for long-term storage."
- **New cache**: "Day 12: The speed depot (Redis cache) goes online — no more walking to the basement for every request."
- **New routes**: "Day 15: Three new production lines open up — the factory is expanding fast."
- **Removed nodes**: "Day 20: The old mail room has been decommissioned. Progress marches on."
- **New queue**: "Day 25: A conveyor belt system is installed to handle overflow work orders."
- **New worker**: "Day 30: Night-shift workers have been hired to process jobs while the factory sleeps."

Be creative but concise. Each narrative should be 1-2 sentences max.

## Step 5: POST Timelapse Data

Send the complete timelapse array to the server:

```bash
TMPFILE=$(mktemp /tmp/factory-timelapse-XXXXXX.json)
# Write the timelapse JSON array to the temp file
curl -s -X POST http://localhost:7777/api/timelapse \
  -H "Content-Type: application/json" \
  -d @"$TMPFILE"
rm -f "$TMPFILE"
```

## Step 6: Report

Tell the user:

- Time-lapse has been generated with **N** snapshots covering the last **N** commits.
- Open http://localhost:7777 and use the **timeline slider** at the bottom of the factory canvas to scrub through history.
- Press the **play button** to auto-advance through commits.
- Each snapshot shows the factory as it existed at that point in time, with a narrative log entry describing what changed.
- Commits that had no backend files were skipped.

## Error Handling

- If `git` is not available or the directory is not a git repo, tell the user.
- If no commits have backend-relevant files, report that no architecture snapshots could be generated.
- Always clean up worktrees, even on failure:
  ```bash
  git worktree list | grep factory-timelapse | awk '{print $1}' | xargs -I{} git worktree remove {} --force 2>/dev/null
  ```
