#!/bin/bash

# This script updates the logger imports in the codebase
# to use the new centralized logger module instead of importing from server.ts

# Function to update logger imports in a file
update_file() {
    local file="$1"
    echo "Updating $file"

    # Replace import statement for logger from server with import from logger module
    sed -i '' 's/import { logger } from "@\/server";/import { serviceLogger as logger } from "@\/common\/utils\/logger";/g' "$file"

    # Handle cases where logger is imported alongside other imports from server
    sed -i '' 's/import { app, logger } from "@\/server";/import { app } from "@\/server";\nimport { serverLogger as logger } from "@\/common\/utils\/logger";/g' "$file"
}

# Find all TypeScript files that import logger from server
echo "Finding files that import logger from @/server"
grep -l "import.*logger.*from.*@/server" $(find ./src -name "*.ts" | grep -v "node_modules") | while read -r file; do
    update_file "$file"
done

echo "Import updates completed."
