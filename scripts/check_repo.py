#!/usr/bin/env python3
"""Validate the documentation-first repository without external dependencies."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = (
    "README.md",
    "README.fr.md",
    "PROJECT_BRIEF.md",
    "ROADMAP.md",
    "CONTRIBUTING.md",
    "LICENSE",
    "MODEL_LICENSES.md",
    "docs/MVP.md",
    "docs/ARCHITECTURE.md",
    "docs/CONCEPTION.fr.md",
    "docs/schemas/project.schema.json",
)

FORBIDDEN_MODEL_EXTENSIONS = {
    ".ckpt",
    ".safetensors",
    ".pt",
    ".pth",
    ".onnx",
    ".gguf",
}

MARKDOWN_LINK = re.compile(r"(?<!!)\[[^\]]*\]\(([^)]+)\)")


def validate_required_files(errors: list[str]) -> None:
    for relative in REQUIRED_FILES:
        path = ROOT / relative
        if not path.is_file():
            errors.append(f"Missing required file: {relative}")


def validate_json(errors: list[str]) -> None:
    for path in ROOT.rglob("*.json"):
        if ".git" in path.parts:
            continue
        try:
            json.loads(path.read_text(encoding="utf-8"))
        except (OSError, UnicodeError, json.JSONDecodeError) as exc:
            errors.append(f"Invalid JSON in {path.relative_to(ROOT)}: {exc}")


def normalize_markdown_target(raw_target: str) -> str | None:
    target = raw_target.strip()
    if not target or target.startswith(("#", "http://", "https://", "mailto:")):
        return None
    if target.startswith("<") and target.endswith(">"):
        target = target[1:-1]
    target = target.split("#", 1)[0].split("?", 1)[0]
    target = unquote(target).strip()
    return target or None


def validate_markdown_links(errors: list[str]) -> None:
    for path in ROOT.rglob("*.md"):
        if ".git" in path.parts:
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except (OSError, UnicodeError) as exc:
            errors.append(f"Cannot read {path.relative_to(ROOT)}: {exc}")
            continue

        for match in MARKDOWN_LINK.finditer(text):
            target = normalize_markdown_target(match.group(1))
            if target is None:
                continue
            destination = (path.parent / target).resolve()
            try:
                destination.relative_to(ROOT.resolve())
            except ValueError:
                errors.append(
                    f"Link escapes repository in {path.relative_to(ROOT)}: {target}"
                )
                continue
            if not destination.exists():
                errors.append(
                    f"Broken local link in {path.relative_to(ROOT)}: {target}"
                )


def validate_forbidden_weights(errors: list[str]) -> None:
    for path in ROOT.rglob("*"):
        if not path.is_file() or ".git" in path.parts:
            continue
        if path.suffix.lower() in FORBIDDEN_MODEL_EXTENSIONS:
            errors.append(f"Model weight must not be committed: {path.relative_to(ROOT)}")


def validate_text_files(errors: list[str]) -> None:
    text_extensions = {".md", ".json", ".yml", ".yaml", ".py", ".txt"}
    for path in ROOT.rglob("*"):
        if not path.is_file() or ".git" in path.parts:
            continue
        if path.name == "LICENSE" or path.suffix.lower() in text_extensions:
            try:
                data = path.read_bytes()
            except OSError as exc:
                errors.append(f"Cannot read {path.relative_to(ROOT)}: {exc}")
                continue
            if data and not data.endswith(b"\n"):
                errors.append(f"Missing final newline: {path.relative_to(ROOT)}")


def main() -> int:
    errors: list[str] = []
    validate_required_files(errors)
    validate_json(errors)
    validate_markdown_links(errors)
    validate_forbidden_weights(errors)
    validate_text_files(errors)

    if errors:
        print("Repository validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    markdown_count = sum(1 for _ in ROOT.rglob("*.md"))
    json_count = sum(1 for _ in ROOT.rglob("*.json"))
    print(
        f"Repository validation passed: {markdown_count} Markdown files, "
        f"{json_count} JSON files."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
