# MongoDB Seed Data

This directory contains JSON files with mock data ready to import into MongoDB.

## Database Structure

The application uses **two separate databases**:

1. **`personal-finance-mock`** - Mock data for development/testing
2. **`personal-finance`** - Real user data for production

## Files

- `users.json` - User accounts (admin, dev, users)
- `transactions.json` - Transaction history
- `accounts.json` - Bank accounts
- `budget_categories.json` - Budget categories
- `savings_goals.json` - Savings goals
- `recurring_bills.json` - Recurring bills
- `notifications.json` - User notifications
- `page_layouts.json` - Page customization layouts
- `restore_points.json` - Page restore points

## Import Instructions

### Using MongoDB Compass (GUI)

1. Open MongoDB Compass
2. Connect to your MongoDB instance
3. Create a new database: `personal-finance-mock`
4. For each JSON file:
   - Click "Add Data" → "Import File"
   - Select the JSON file
   - Collection name should match the file name (without .json)
   - Click "Import"

### Using mongoimport (Command Line)

```bash
# Set your MongoDB connection string
MONGODB_URI="mongodb://localhost:27017"

# Import all collections into mock database
mongoimport --uri="${MONGODB_URI}/personal-finance-mock" --collection=users --file=users.json --jsonArray
mongoimport --uri="${MONGODB_URI}/personal-finance-mock" --collection=transactions --file=transactions.json --jsonArray
mongoimport --uri="${MONGODB_URI}/personal-finance-mock" --collection=accounts --file=accounts.json --jsonArray
mongoimport --uri="${MONGODB_URI}/personal-finance-mock" --collection=budget_categories --file=budget_categories.json --jsonArray
mongoimport --uri="${MONGODB_URI}/personal-finance-mock" --collection=savings_goals --file=savings_goals.json --jsonArray
mongoimport --uri="${MONGODB_URI}/personal-finance-mock" --collection=recurring_bills --file=recurring_bills.json --jsonArray
mongoimport --uri="${MONGODB_URI}/personal-finance-mock" --collection=notifications --file=notifications.json --jsonArray
mongoimport --uri="${MONGODB_URI}/personal-finance-mock" --collection=page_layouts --file=page_layouts.json --jsonArray
mongoimport --uri="${MONGODB_URI}/personal-finance-mock" --collection=restore_points --file=restore_points.json --jsonArray
```

### Using MongoDB Shell (mongosh)

```javascript
// Connect to MongoDB
use personal-finance-mock

// Import each collection
db.users.insertMany(JSON.parse(cat('users.json')))
db.transactions.insertMany(JSON.parse(cat('transactions.json')))
db.accounts.insertMany(JSON.parse(cat('accounts.json')))
db.budget_categories.insertMany(JSON.parse(cat('budget_categories.json')))
db.savings_goals.insertMany(JSON.parse(cat('savings_goals.json')))
db.recurring_bills.insertMany(JSON.parse(cat('recurring_bills.json')))
db.notifications.insertMany(JSON.parse(cat('notifications.json')))
db.page_layouts.insertMany(JSON.parse(cat('page_layouts.json')))
db.restore_points.insertMany(JSON.parse(cat('restore_points.json')))
```

## Environment Variables

Set these in your `.env.local` file:

```env
# MongoDB connection
MONGODB_URI=mongodb://localhost:27017
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/

# Database names
MOCK_DB_NAME=personal-finance-mock
REAL_DB_NAME=personal-finance

# Use mock database in development
USE_MOCK_DB=true
```

## Default Test Accounts

After importing, you can log in with:

- **Admin**: `admin@example.com` / `admin123`
- **User**: `john.doe@example.com` / `user123`
- **Dev**: `dev@example.com` / `dev123`

## Notes

- All transactions are associated with user ID `2` (John Doe) by default
- All accounts, budgets, savings goals, and bills are also associated with user ID `2`
- The `_id` field in JSON files uses the original `id` value for easier reference
- Dates are stored as ISO strings or Date objects depending on the field

