<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Structure

Vertical slices: each part of the site is a folder in `modules/` with a public `index.ts` (and
`server.ts` for server-only code). Routes in `app/` import modules only; modules import each
other only through those entries; `shared/` imports no module. `npm run check:boundaries`
enforces it. See [Project structure](README.md#project-structure).

## Comments

Write no comments by default. Add one only when the code would otherwise be wrong to change: a workaround for a library or platform bug, a security measure, or a constraint nobody could infer from the code. No docstrings that restate a name, no notes on what the code does or how it got here, no rationale for ordinary choices. The existing comments in the codebase are not a style to match.

## Pull requests

PR titles follow Conventional Commits, `type(scope): summary`, for example `fix(team): spell a name correctly`. Types, scopes and how to write the description are in [CONTRIBUTING.md](CONTRIBUTING.md).
