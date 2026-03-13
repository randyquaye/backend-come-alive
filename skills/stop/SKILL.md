---
name: stop
description: Shut down the Backend Factory visualization server
disable-model-invocation: true
allowed-tools: Bash
---

# Backend Factory - Stop

Kill the Backend Factory server process running on port 7777.

```bash
lsof -ti:7777 | xargs kill 2>/dev/null || true
```

Confirm to the user that the Backend Factory has been shut down.
