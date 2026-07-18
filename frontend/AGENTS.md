<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Verification Policy

For trivial UI edits such as copy changes, icon swaps, class tweaks, spacing adjustments, or one-component visual fixes:

- Make the smallest source edit needed.
- Do not run package installs, dependency restores, `pnpm run lint`, builds, dev servers, browser testing, or network commands unless explicitly requested.
- If `node_modules/.bin/eslint` already exists, a direct local lint check is allowed.
- If verification requires installing dependencies, relinking `node_modules`, approving builds, relaxing pnpm policies, or network access, stop and report: "Change made; verification skipped because dependency setup is blocked."
- Do not clean, remove, or recreate dependency directories for trivial UI edits.
- Avoid full design-skill setup for one-line copy, icon, or style fixes unless the user asks for design review.
