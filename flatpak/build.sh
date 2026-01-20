#!/bin/bash
set -e

cd "$(dirname "$0")/.."

echo "Building Armory Flatpak..."

bun run bundle

cp node_modules/@gtkx/native-linux-x64/index.node dist/

flatpak-builder \
    --force-clean \
    --user \
    --install-deps-from=flathub \
    --repo=flatpak-repo \
    build-dir \
    flatpak/dev.ztluwu.armory.yaml

flatpak build-bundle \
    flatpak-repo \
    dist/dev.ztluwu.armory.flatpak \
    dev.ztluwu.armory

echo "Flatpak built: dist/dev.ztluwu.armory.flatpak"
echo ""
echo "To install:"
echo "  flatpak install --user dist/dev.ztluwu.armory.flatpak"
echo ""
echo "To run:"
echo "  flatpak run dev.ztluwu.armory"