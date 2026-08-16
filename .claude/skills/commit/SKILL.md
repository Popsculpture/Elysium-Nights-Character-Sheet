---
name: commit
description: Commit the working tree to the current branch with a sensible message. Solo-dev flow on main, no branch and no pull request. Only runs when I invoke it.
disable-model-invocation: true
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git add:*), Bash(git commit:*)
---

Commit my working-tree changes the way I like as a solo dev working directly on `main`.

1. Run `git status --short` and `git diff --stat` to see what changed.
2. Stage everything with `git add -A`.
3. Write a concise, sensible commit message yourself (do not ask me for one): an
   imperative subject line that says what changed, plus a short body explaining why
   if it helps. Do not use em or en dashes anywhere in the message.
4. Commit to the current branch (`main`). Do NOT create a branch and do NOT open a
   pull request.
5. Do NOT push. Report the short commit hash and a one-line summary of what landed,
   then remind me, on its own line, that I still need to run `git push` to deploy
   the change to elysiumnightsrpg.com. I will push myself when I am ready.
