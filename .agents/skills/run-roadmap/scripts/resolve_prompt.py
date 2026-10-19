#!/usr/bin/env python3
"""Print a selected repository prompt; never infer acceptance or mutate files."""
import argparse
from pathlib import Path
import re
import sys


def load_prompts(repo):
    found = {}
    for path in sorted((repo / "docs" / "prompts").glob("v*.md")):
        for block in re.findall(r"```text\n(.*?)\n```", path.read_text(encoding="utf-8"), re.S):
            match = re.match(r"Execute (P\d{2}) for V([0-9.]+): ([^\n]+)", block)
            if not match:
                continue
            key, version, title = match.groups()
            if key in found:
                raise ValueError(f"Duplicate prompt: {key}")
            found[key] = (version, title, path, block)
    expected = {f"P{n:02d}" for n in range(1, 37)}
    if set(found) != expected:
        raise ValueError("Expected exactly P01-P36 in docs/prompts/v*.md")
    return found


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--list", action="store_true", help="List prompt IDs, versions and titles")
    group.add_argument("--prompt", metavar="PXX", help="Print one full prompt block")
    # Accept the ergonomic positional form without a second ambiguity-prone parser.
    args_in = sys.argv[1:]
    if len(args_in) == 1 and not args_in[0].startswith("-"):
        args_in = ["--prompt", args_in[0]]
    args = parser.parse_args(args_in)
    if args.prompt and not re.fullmatch(r"P(?:0[1-9]|[12][0-9]|3[0-6])", args.prompt):
        parser.error("Use an exact prompt ID from P01 to P36")
    repo = Path(__file__).resolve().parents[4]
    try:
        found = load_prompts(repo)
    except (OSError, ValueError) as exc:
        parser.error(str(exc))
    if args.list:
        for key, (version, title, _, _) in sorted(found.items()):
            print(f"{key}  V{version}  {title}")
    else:
        version, title, path, block = found[args.prompt]
        print(f"Source: {path.relative_to(repo)}#{args.prompt.lower()}")
        print("Text resolution only; check roadmap, decisions and evidence before execution.\n")
        print(block)


if __name__ == "__main__":
    main()
