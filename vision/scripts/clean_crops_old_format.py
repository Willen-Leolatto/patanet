# scripts/clean_crops_old_format.py
# Move crops antigos (sem hash) para uma pasta "outputs/crops_legacy"
# Mantém somente o padrão novo: ..._<10hex>_<j>.jpg

import re
from pathlib import Path
import shutil

CROPS_DIR = Path("outputs/crops")
LEGACY_DIR = Path("outputs/crops_legacy")
LEGACY_DIR.mkdir(parents=True, exist_ok=True)

# novo padrão: ..._<10 hex>_<j>.jpg
pat_new = re.compile(r".*_[0-9a-f]{10}_[0-9]+\.jpg$", re.IGNORECASE)

moved = 0
kept = 0
for p in CROPS_DIR.glob("*.jpg"):
    if pat_new.match(p.name):
        kept += 1
    else:
        shutil.move(str(p), LEGACY_DIR / p.name)
        moved += 1

print(f"Kept (new format): {kept}")
print(f"Moved legacy (old format) -> {LEGACY_DIR}: {moved}")
print("Done.")
