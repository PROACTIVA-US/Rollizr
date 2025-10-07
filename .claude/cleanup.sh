#!/bin/bash
# Rollizr - Session Cleanup Script
# Auto-generated on October 6, 2025

echo "🧹 Cleaning up Rollizr project..."

# Remove common temporary files
echo "Removing temporary files..."
find . -name "*.tmp" -type f -delete 2>/dev/null
find . -name "*.log" -type f -delete 2>/dev/null
find . -name "*.swp" -type f -delete 2>/dev/null
find . -name ".DS_Store" -type f -delete 2>/dev/null
find . -name "Thumbs.db" -type f -delete 2>/dev/null

# Clean Node.js cache (detected package.json)
echo "Cleaning Node.js cache..."
rm -rf .npm 2>/dev/null
rm -rf .node_repl_history 2>/dev/null

# Clean npm debug logs
find . -name "npm-debug.log*" -type f -delete 2>/dev/null

# Clean coverage files
rm -rf coverage 2>/dev/null
rm -rf .nyc_output 2>/dev/null

# Clean test cache
rm -rf .jest 2>/dev/null

# Update memory.md timestamp
if [ -f ".claude/memory.md" ]; then
    echo "Updating memory.md timestamp..."
    # This is already handled by the end-session command
fi

# Remove empty directories
echo "Removing empty directories..."
find . -type d -empty -delete 2>/dev/null

echo "✅ Cleanup complete!"
echo ""
echo "Session cleaned:"
echo "  - Temporary files removed"
echo "  - Cache files cleared"
echo "  - Empty directories removed"
echo ""
echo "Ready for next session! 🚀"
