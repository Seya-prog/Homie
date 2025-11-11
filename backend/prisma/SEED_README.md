# Database Seeding Guide

This guide explains how to populate your Homie database with demo data for testing and presentations.

## What Gets Seeded

### Demo Users (4 total)
- **3 Landlords** (can create properties)
  - `landlord1@homie.et` - Abebe Kebede
  - `landlord2@homie.et` - Almaz Tesfaye  
  - `landlord3@homie.et` - Dawit Haile

- **1 Tenant** (can rent properties)
  - `marta.solomon@gmail.com` - Marta Solomon

**All passwords:** `password123`

### Demo Properties (8 total)
- 2BR Modern Apartment in Bole (ETB 18,000/month)
- 3BR Spacious House in CMC (ETB 25,000/month)
- 1BR Luxury Studio in Kazanchis (ETB 12,000/month)
- 4BR Beautiful Villa in Old Airport (ETB 75,000/month)
- 1BR Affordable in Megenagna (ETB 8,000/month) - **RENTED**
- 3BR Penthouse in Sarbet (ETB 45,000/month)
- 2BR Cozy in Gerji (ETB 13,000/month)
- Office Space in Mexico Square (ETB 35,000/month)

### Additional Demo Data
- 1 Active rental agreement
- 3 Payment records (2 completed, 1 pending)
- 1 Maintenance request (pending)

## How to Run the Seed

### Option 1: Using Docker (Recommended)

```bash
# Access the backend container
docker-compose exec backend sh

# Run the seed script
npm run db:seed
```

### Option 2: Using npm script directly

```bash
# Navigate to backend directory
cd backend

# Run the seed script
npm run db:seed
```

### Option 3: Reset database and seed

If you want to clear all existing data and start fresh:

```bash
# WARNING: This will delete ALL data!
docker-compose exec backend npm run db:reset

# Then seed
docker-compose exec backend npm run db:seed
```

## After Seeding

1. **Login to the application:**
   - Go to `http://localhost:3000/login`
   - Use any of the demo credentials above

2. **As Landlord:**
   - View your properties on the dashboard
   - Add new properties
   - Manage maintenance requests
   - View rental income

3. **As Tenant:**
   - Browse available properties
   - View your active rental
   - Make payments
   - Submit maintenance requests

## Troubleshooting

### "Database not found" error
Make sure your database is running:
```bash
docker-compose up -d db
```

### "Unique constraint failed" error
The seed script uses `upsert` for users, so you can run it multiple times. If you still get errors, reset the database first:
```bash
docker-compose exec backend npm run db:reset
```

### Can't access backend container
Make sure containers are running:
```bash
docker-compose up -d
docker-compose ps
```

## Demo Scenarios

### Scenario 1: Property Listing Flow
1. Login as `landlord1@homie.et`
2. Go to dashboard → "List New Property"
3. Fill in property details
4. Submit and view your new listing

### Scenario 2: Rental Application Flow
1. Login as `tenant1@homie.et`
2. Browse properties
3. Select a property and apply
4. Fill in application details

### Scenario 3: Payment Management
1. Login as `tenant1@homie.et`
2. Go to "Payment History"
3. View completed and pending payments
4. Make a payment for pending rent

### Scenario 4: Maintenance Request
1. Login as `tenant1@homie.et`
2. Go to "Request Maintenance"
3. Submit a new maintenance request
4. Login as landlord to view and respond

## Notes

- All demo users have verified KYC status
- Properties include realistic Ethiopian locations in Addis Ababa
- Images use placeholder URLs from Unsplash
- Payment amounts are in Ethiopian Birr (ETB)
