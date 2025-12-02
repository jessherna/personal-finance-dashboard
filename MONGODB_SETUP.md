# MongoDB Setup Guide

This project uses MongoDB for data storage with **two separate databases**:
- **Mock Database** (`personal-finance-mock`) - For development and testing
- **Real Database** (`personal-finance`) - For production user data

## Quick Start

### 1. Install MongoDB

- **Local**: Download from [mongodb.com](https://www.mongodb.com/try/download/community)
- **Cloud**: Use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (free tier available)

### 2. Generate JSON Seed Files

```bash
npm run generate:mock-data
```

This creates JSON files in `mongodb-seed-data/` directory.

### 3. Import Mock Data

**Option A: Using MongoDB Compass (Recommended)**
1. Open MongoDB Compass
2. Connect to your MongoDB instance
3. Create database: `personal-finance-mock`
4. Import each JSON file from `mongodb-seed-data/` folder

**Option B: Using Command Line (Windows PowerShell)**
```powershell
.\scripts\import-mock-data.ps1
```

**Option C: Using Command Line (Linux/Mac)**
```bash
chmod +x scripts/import-mock-data.sh
./scripts/import-mock-data.sh
```

**Option D: Manual Import**
```bash
mongoimport --uri="mongodb://localhost:27017/personal-finance-mock" --collection=users --file=mongodb-seed-data/users.json --jsonArray
# Repeat for each collection
```

### 4. Configure Environment Variables

Create `.env.local` file:

```env
MONGODB_URI=mongodb://localhost:27017
MOCK_DB_NAME=personal-finance-mock
REAL_DB_NAME=personal-finance
USE_MOCK_DB=true
```

For MongoDB Atlas:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
```

## Database Structure

### Collections

| Collection | Description | File |
|------------|-------------|------|
| `users` | User accounts (admin, dev, users) | `users.json` |
| `transactions` | Transaction history | `transactions.json` |
| `accounts` | Bank accounts | `accounts.json` |
| `budget_categories` | Budget categories | `budget_categories.json` |
| `savings_goals` | Savings goals | `savings_goals.json` |
| `recurring_bills` | Recurring bills | `recurring_bills.json` |
| `notifications` | User notifications | `notifications.json` |
| `page_layouts` | Page customization layouts | `page_layouts.json` |
| `restore_points` | Page restore points | `restore_points.json` |

## Test Accounts

After importing, you can log in with:

- **Admin**: `admin@example.com` / `admin123`
- **User**: `john.doe@example.com` / `user123`
- **Dev**: `dev@example.com` / `dev123`

## Architecture

### Database Selection

The application automatically selects the database based on user role:
- **Admin/Dev users** → Always use `personal-finance-mock` database
- **Regular users** → Always use `personal-finance` database

No configuration needed - it's automatic!

### Data Models

All models are defined in `lib/models/`:
- `User.ts` - User accounts
- `Transaction.ts` - Transactions
- `Account.ts` - Bank accounts
- `Budget.ts` - Budget categories
- `Savings.ts` - Savings goals
- `RecurringBill.ts` - Recurring bills
- `Notification.ts` - Notifications
- `PageLayout.ts` - Page layouts
- `RestorePoint.ts` - Restore points

### Connection Management

Connection utilities are in `lib/db/mongodb.ts`:
- `connectMockDB()` - Connect to mock database
- `connectRealDB()` - Connect to real database
- `getDBConnection(userRole)` - Get appropriate connection based on user role
  - `userRole === "user"` → Returns real database connection
  - `userRole === "admin" || "dev"` → Returns mock database connection

## Next Steps

1. ✅ MongoDB connection utilities created
2. ✅ Mongoose schemas defined
3. ✅ JSON seed files generated
4. ⏳ Update API routes to use MongoDB (next step)
5. ⏳ Update data access layer (next step)

## Notes

- All mock data is associated with user ID `2` (John Doe) by default
- The `_id` field in JSON uses the original `id` value for easier reference
- Dates are stored as ISO strings or Date objects
- Icons in savings goals are converted to emoji strings for storage

