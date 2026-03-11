#!/bin/bash
# bump-version.sh — Bump version across all QuizForge packages
# Usage: ./scripts/bump-version.sh 0.2.0

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <version>"
  echo "Example: $0 0.2.0"
  exit 1
fi

VERSION="$1"
echo "Bumping version to ${VERSION}..."

# Root package.json
sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"${VERSION}\"/" package.json
echo "  ✓ package.json"

# Creator
sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"${VERSION}\"/" apps/creator/package.json
sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"${VERSION}\"/" apps/creator/src-tauri/tauri.conf.json
sed -i "s/^version = \"[^\"]*\"/version = \"${VERSION}\"/" apps/creator/src-tauri/Cargo.toml
echo "  ✓ apps/creator"

# Player
sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"${VERSION}\"/" apps/player/package.json
sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"${VERSION}\"/" apps/player/src-tauri/tauri.conf.json
sed -i "s/^version = \"[^\"]*\"/version = \"${VERSION}\"/" apps/player/src-tauri/Cargo.toml
echo "  ✓ apps/player"

# Shared packages
for pkg in packages/types packages/quiz-engine packages/ui; do
  if [ -f "${pkg}/package.json" ]; then
    sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"${VERSION}\"/" "${pkg}/package.json"
    echo "  ✓ ${pkg}"
  fi
done

echo ""
echo "Done! Version bumped to ${VERSION}"
echo ""
echo "Next steps:"
echo "  1. Review changes: git diff"
echo "  2. Commit: git add -A && git commit -m 'chore: bump version to ${VERSION}'"
echo "  3. Tag: git tag v${VERSION}"
echo "  4. Push: git push origin main --tags"
