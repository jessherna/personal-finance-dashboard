#!/bin/bash

# Script to import all mock data into MongoDB
# Usage: ./scripts/import-mock-data.sh

MONGODB_URI="${MONGODB_URI:-mongodb://localhost:27017}"
DB_NAME="${MOCK_DB_NAME:-personal-finance-mock}"
DATA_DIR="mongodb-seed-data"

echo "Importing mock data into MongoDB..."
echo "Database: ${DB_NAME}"
echo "URI: ${MONGODB_URI}"
echo ""

# Check if mongoimport is available
if ! command -v mongoimport &> /dev/null; then
    echo "Error: mongoimport not found. Please install MongoDB Database Tools."
    echo "Download from: https://www.mongodb.com/try/download/database-tools"
    exit 1
fi

# Import each collection
collections=(
    "users:users"
    "transactions:transactions"
    "accounts:accounts"
    "budget_categories:budget_categories"
    "savings_goals:savings_goals"
    "recurring_bills:recurring_bills"
    "notifications:notifications"
    "page_layouts:page_layouts"
    "restore_points:restore_points"
)

for collection_pair in "${collections[@]}"; do
    IFS=':' read -r file_name collection_name <<< "$collection_pair"
    file_path="${DATA_DIR}/${file_name}.json"
    
    if [ -f "$file_path" ]; then
        echo "Importing ${collection_name}..."
        mongoimport --uri="${MONGODB_URI}/${DB_NAME}" \
            --collection="${collection_name}" \
            --file="${file_path}" \
            --jsonArray \
            --drop
        if [ $? -eq 0 ]; then
            echo "✅ Successfully imported ${collection_name}"
        else
            echo "❌ Failed to import ${collection_name}"
        fi
    else
        echo "⚠️  File not found: ${file_path}"
    fi
    echo ""
done

echo "✅ Import complete!"

