#!/bin/bash

# Clean and create dist directory
rm -rf dist
mkdir -p dist

# Copy HTML file
cp index.html dist/

# Copy all game source files
cp -r src dist/

# Copy assets
cp -r assets dist/

# Create node_modules directory in dist and copy Phaser
mkdir -p dist/node_modules/phaser/dist
cp node_modules/phaser/dist/phaser.min.js dist/node_modules/phaser/dist/

echo "Build complete! Files ready in dist/"