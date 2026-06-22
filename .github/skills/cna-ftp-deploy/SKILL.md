---
name: cna-ftp-deploy
description: Configure and validate safe GitHub Actions FTPS deployment for CNA iframe/embed projects hosted below /missions/embed. Use when setting up a new repository, migrating a manual FileZilla deployment, generating a project deployment workflow, or checking an existing embed package before publishing.
---

# CNA FTP Embed Deploy

Configure one repository to publish one isolated embed package to
`/missions/embed/<project-slug>` through Explicit FTPS.

## Workflow

1. Read the repository instructions and inspect its build/deploy structure.
2. Ask only for the project folder name when it cannot be derived safely. Accept
   a slug, not a path. Reject `/`, `..`, `missions`, `embed`, and path separators.
3. Determine the local publish directory without changing application files:
   - Prefer an existing `.deploy.yml` source.
   - Otherwise prefer exactly one `dist`, `build`, `public`, or `*-deploy`
     directory containing the complete production artifact.
   - If multiple candidates exist, ask the user to choose.
   - Use repository root only after confirming it contains deployable files and
     the workflow excludes repository metadata and internal documentation.
4. Inspect the embed contract in [references/embed-contract.md](references/embed-contract.md).
   Infer entrypoints, loader, resize message type, and test page from the code.
   Ask only when inspection is ambiguous.
5. Run `scripts/configure_deploy.py` with the derived values. Do not use
   `--force` unless the user approved replacing an existing deployment workflow.
6. Review the generated `.deploy.yml` and `.github/workflows/deploy.yml`.
7. Run the script again with `--check-only`, then validate YAML and shell syntax.
8. Tell the user to configure `DEPLOY_USER` and `DEPLOY_PASSWORD` as repository
   Actions secrets. Never request, display, store, or commit the credentials.
9. Do not commit, push, or start a production deployment unless explicitly asked.

Example:

```bash
python3 .github/skills/cna-ftp-deploy/scripts/configure_deploy.py \
  --repo . \
  --slug wc2026 \
  --source wc2026-v1.0-deploy \
  --entrypoint wc2026-schedule.html \
  --entrypoint wc2026-groups.html \
  --entrypoint wc2026-bracket.html \
  --loader embed-loader.js \
  --message-type wc2026-resize \
  --test-page test-embed.html
```

## Safety rules

- Construct the remote path internally as `/missions/embed/<slug>`; never accept
  a user-provided absolute deployment path.
- Keep `mirror --delete` scoped to that exact child directory.
- Deploy only the selected publish directory, not the repository by default.
- Require TLS certificate verification. Do not weaken it to make a failed
  connection pass.
- Block broad service-worker cache deletion that can remove caches belonging to
  sibling projects on the same origin.
- Require project-specific postMessage event names and source-window matching in
  the host loader.
- Treat `test-embed.html`, admin tools, source data, specs, and credentials as
  non-production unless the repository explicitly defines them as public.

## Repository secret limitation

The shared Skill contains no FTP credentials. Repositories owned by a personal
GitHub account must configure `DEPLOY_USER` and `DEPLOY_PASSWORD` separately.
An organization may replace them with organization-level secrets available to
the selected repositories.
