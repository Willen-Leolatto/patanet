#!/usr/bin/env python3
"""
Valida se um prompt estruturado contém os blocos XML obrigatórios.
Uso: python3 scripts/validate-structure.py < arquivo.md
"""
import re
import sys

REQUIRED = ["<task>", "<role>", "<requirements>", "<critical>"]
OPTIONAL = ["<endpoints>", "<tests>"]

def main():
    content = sys.stdin.read()
    errors = []

    for tag in REQUIRED:
        if tag not in content:
            errors.append(f"MISSING: {tag}")

    if errors:
        print("\n".join(errors), file=sys.stderr)
        sys.exit(1)
    print("SUCCESS: All required blocks present.")
    sys.exit(0)

if __name__ == "__main__":
    main()
