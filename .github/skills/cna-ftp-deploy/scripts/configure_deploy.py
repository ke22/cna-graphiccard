#!/usr/bin/env python3
"""Validate an embed artifact and generate its FTPS deployment configuration."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9_-]{0,62}$")
ROOT_RELATIVE_ASSET_RE = re.compile(r"(?:src|href)\s*=\s*['\"]/[^/]", re.I)
BROAD_CACHE_DELETE_RE = re.compile(
    r"filter\s*\(\s*\w+\s*=>\s*\w+\s*!==?\s*[A-Z_][A-Z0-9_]*\s*\)", re.S
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", default=".", help="repository root")
    parser.add_argument("--slug", required=True, help="folder name below /missions/embed")
    parser.add_argument("--source", required=True, help="production artifact directory")
    parser.add_argument("--entrypoint", action="append", required=True)
    parser.add_argument("--loader", default="embed-loader.js")
    parser.add_argument("--message-type", required=True)
    parser.add_argument("--test-page", default="test-embed.html")
    parser.add_argument("--check-only", action="store_true")
    parser.add_argument("--force", action="store_true")
    return parser.parse_args()


def safe_relative(value: str, label: str) -> Path:
    path = Path(value)
    if path.is_absolute() or ".." in path.parts:
        raise ValueError(f"{label} must be a safe repository-relative path: {value}")
    return path


def validate(args: argparse.Namespace) -> tuple[Path, Path]:
    if not SLUG_RE.fullmatch(args.slug) or args.slug in {"missions", "embed"}:
        raise ValueError("slug must be a lowercase project folder name, not a path")

    repo = Path(args.repo).resolve()
    if not (repo / ".git").exists():
        raise ValueError(f"not a Git repository: {repo}")

    source_rel = safe_relative(args.source, "source")
    source = (repo / source_rel).resolve()
    if not source.is_dir() or repo not in source.parents and source != repo:
        raise ValueError(f"source directory does not exist inside repository: {source_rel}")

    files: dict[str, Path] = {}
    for label, value in [
        *(('entrypoint', item) for item in args.entrypoint),
        ("loader", args.loader),
        ("test page", args.test_page),
    ]:
        rel = safe_relative(value, label)
        path = source / rel
        if not path.is_file():
            raise ValueError(f"{label} does not exist in source: {rel}")
        files[f"{label}:{rel}"] = path

    loader_text = (source / safe_relative(args.loader, "loader")).read_text(
        encoding="utf-8", errors="replace"
    )
    if args.message_type not in loader_text or "contentWindow" not in loader_text:
        raise ValueError("loader must match the message type and iframe contentWindow")

    for entrypoint in args.entrypoint:
        path = source / safe_relative(entrypoint, "entrypoint")
        text = path.read_text(encoding="utf-8", errors="replace")
        if "postMessage" not in text or args.message_type not in text:
            raise ValueError(f"entrypoint does not emit {args.message_type}: {entrypoint}")
        if ROOT_RELATIVE_ASSET_RE.search(text):
            raise ValueError(f"entrypoint contains a root-relative local asset: {entrypoint}")

    for worker in source.rglob("sw.js"):
        text = worker.read_text(encoding="utf-8", errors="replace")
        if "caches.keys" in text and BROAD_CACHE_DELETE_RE.search(text):
            raise ValueError(
                f"service worker may delete sibling-project caches: {worker.relative_to(source)}"
            )

    return repo, source_rel


def yaml_quote(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def render_manifest(args: argparse.Namespace, source: Path) -> str:
    lines = [
        "version: 1",
        "type: embed",
        f"slug: {yaml_quote(args.slug)}",
        f"source: {yaml_quote(source.as_posix())}",
        f"deploy_path: {yaml_quote('/missions/embed/' + args.slug)}",
        f"public_url: {yaml_quote('https://www.cna.com.tw/missions/embed/' + args.slug)}",
        "entrypoints:",
        *(f"  - {yaml_quote(item)}" for item in args.entrypoint),
        f"loader: {yaml_quote(args.loader)}",
        f"resize_message: {yaml_quote(args.message_type)}",
        f"test_page: {yaml_quote(args.test_page)}",
        "",
    ]
    return "\n".join(lines)


def write_checked(path: Path, content: str, force: bool) -> None:
    if path.exists() and path.read_text(encoding="utf-8") != content and not force:
        raise ValueError(f"refusing to replace existing file without --force: {path}")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def main() -> int:
    args = parse_args()
    try:
        repo, source = validate(args)
        if args.check_only:
            print(f"OK: /missions/embed/{args.slug} from {source}")
            return 0

        skill_root = Path(__file__).resolve().parent.parent
        template = (skill_root / "assets" / "deploy.yml.template").read_text(encoding="utf-8")
        workflow = (
            template.replace("__SLUG__", args.slug)
            .replace("__SOURCE__", source.as_posix())
            .replace("__ENTRYPOINTS__", ",".join(args.entrypoint))
            .replace("__LOADER__", args.loader)
            .replace("__MESSAGE_TYPE__", args.message_type)
            .replace("__TEST_PAGE__", args.test_page)
        )
        write_checked(repo / ".deploy.yml", render_manifest(args, source), args.force)
        write_checked(repo / ".github" / "workflows" / "deploy.yml", workflow, args.force)
        print(f"Configured /missions/embed/{args.slug} from {source}")
        print("Required repository secrets: DEPLOY_USER, DEPLOY_PASSWORD")
        return 0
    except ValueError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
