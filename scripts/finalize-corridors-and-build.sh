#!/usr/bin/env bash
# Post-build finalize: swap the slim corridors artifacts into public, drop the
# 236MB monolith, then run the authoritative clean static build.
set -e
cd /c/EconMap

echo "=== [1/5] removing legacy public monolith ==="
rm -f public/data/assets/corridors.json
echo "monolith removed: $([ -f public/data/assets/corridors.json ] && echo NO || echo yes)"

echo "=== [2/5] copying slim index + per-corridor files to public ==="
cp data/processed/assets/corridors-index.json public/data/assets/corridors-index.json
mkdir -p public/data/assets/corridors
cp data/processed/assets/corridors/*.json public/data/assets/corridors/
echo "public corridors dir size: $(du -sh public/data/assets/corridors | cut -f1)"
echo "public index size: $(ls -la public/data/assets/corridors-index.json | awk '{printf "%.0f KB", $5/1024}')"

echo "=== [3/5] cleaning .next ==="
rm -rf .next

echo "=== [4/5] running clean static build ==="
echo "finalize-build start $(date +%H:%M:%S) C:free $(df -h /c|tail -1|awk '{print $4}')" > build-final.log
NODE_OPTIONS="--max-old-space-size=8192" npm run build >> build-final.log 2>&1
echo "FINAL BUILD EXIT $? at $(date +%H:%M:%S)" >> build-final.log

echo "=== [5/5] export verification ==="
if [ -d out ]; then
  echo "out/ exists; total size: $(du -sh out | cut -f1)"
  echo "largest files in out (>5MB):"
  find out -type f -size +5M -printf '%s\t%p\n' 2>/dev/null | sort -rn | head -10 | awk '{printf "%.0f MB\t%s\n", $1/1048576, $2}'
  echo "corridors in out: $(ls out/data/assets/corridors-index.json 2>/dev/null && echo index-ok) $(ls out/data/assets/corridors/ 2>/dev/null | wc -l) per-corridor files"
  echo "monolith in out: $([ -f out/data/assets/corridors.json ] && echo PRESENT-BAD || echo absent-good)"
else
  echo "NO out/ — build failed; see build-final.log"
fi
