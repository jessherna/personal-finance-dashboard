# PowerShell script to import all mock data into MongoDB
# Usage: .\scripts\import-mock-data.ps1

$MONGODB_URI = if ($env:MONGODB_URI) { $env:MONGODB_URI } else { "mongodb://localhost:27017" }
$DB_NAME = if ($env:MOCK_DB_NAME) { $env:MOCK_DB_NAME } else { "personal-finance-mock" }
$DATA_DIR = "mongodb-seed-data"

Write-Host "Importing mock data into MongoDB..." -ForegroundColor Cyan
Write-Host "Database: $DB_NAME"
Write-Host "URI: $MONGODB_URI"
Write-Host ""

# Check if mongoimport is available
$mongoimportPath = Get-Command mongoimport -ErrorAction SilentlyContinue
if (-not $mongoimportPath) {
    Write-Host "Error: mongoimport not found. Please install MongoDB Database Tools." -ForegroundColor Red
    Write-Host "Download from: https://www.mongodb.com/try/download/database-tools" -ForegroundColor Yellow
    exit 1
}

# Collections to import
$collections = @(
    @{ File = "users"; Collection = "users" },
    @{ File = "transactions"; Collection = "transactions" },
    @{ File = "accounts"; Collection = "accounts" },
    @{ File = "budget_categories"; Collection = "budget_categories" },
    @{ File = "savings_goals"; Collection = "savings_goals" },
    @{ File = "recurring_bills"; Collection = "recurring_bills" },
    @{ File = "notifications"; Collection = "notifications" },
    @{ File = "page_layouts"; Collection = "page_layouts" },
    @{ File = "restore_points"; Collection = "restore_points" }
)

foreach ($item in $collections) {
    $filePath = Join-Path $DATA_DIR "$($item.File).json"
    
    if (Test-Path $filePath) {
        Write-Host "Importing $($item.Collection)..." -ForegroundColor Yellow
        $uri = "$MONGODB_URI/$DB_NAME"
        
        & mongoimport --uri=$uri `
            --collection=$($item.Collection) `
            --file=$filePath `
            --jsonArray `
            --drop
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Successfully imported $($item.Collection)" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to import $($item.Collection)" -ForegroundColor Red
        }
    } else {
        Write-Host "⚠️  File not found: $filePath" -ForegroundColor Yellow
    }
    Write-Host ""
}

Write-Host "✅ Import complete!" -ForegroundColor Green

