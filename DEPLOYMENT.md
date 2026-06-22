# FTP/FTPS deployment

Pushing to `main` deploys the static site directly with FTP or Explicit FTPS.
A deployment can also be started manually from the GitHub Actions page. No ZIP
archive or build step is required.

## Server prerequisites

- The FTP account can write to the project's remote directory.
- The remote directory is dedicated to this repository.
- The web server already serves static files from that directory.

## GitHub Actions secrets

Add these repository secrets under **Settings → Secrets and variables → Actions**:

| Secret | Value |
| --- | --- |
| `DEPLOY_HOST` | FTP hostname only, without `ftp://` |
| `DEPLOY_USER` | FTP username |
| `DEPLOY_PASSWORD` | FTP password |
| `DEPLOY_PATH` | Remote project directory, for example `/missions/cna-graphiccard` |
| `DEPLOY_PORT` | Optional; defaults to `21` |
| `DEPLOY_TLS` | Optional; `true` for Explicit FTPS (default), `false` for plain FTP |

Match `DEPLOY_TLS` to the Encryption setting in FileZilla Site Manager:

- **Require explicit FTP over TLS**: use `true`.
- **Only use plain FTP**: use `false`.
- **Implicit FTP over TLS**: this workflow does not currently support that mode.

## Sync behavior

The workflow uses `lftp mirror --reverse --delete`. Files in `DEPLOY_PATH` that
are not present in this repository are removed, except for paths excluded by the
workflow. Always target a project subdirectory such as
`/missions/cna-graphiccard`, never a shared parent such as `/missions`.

## Team embed skill

The repository includes `.github/skills/cna-ftp-deploy` for configuring other
CNA embed repositories. After the skill is pushed to GitHub, team members can
install that directory from `ke22/cna-graphiccard` with the Codex skill
installer.

The skill accepts a project folder name and always constructs the remote target
below `/missions/embed`. It inspects the repository to determine the production
artifact directory, entrypoints, loader, resize message, and test page. If those
cannot be determined safely, it stops and asks for the ambiguous value.

Because `ke22` is a personal GitHub account, `DEPLOY_USER` and
`DEPLOY_PASSWORD` must still be configured once in every target repository.
The skill never stores FTP credentials.
