#!/bin/bash

# TerraGravel Database Setup Script
# Crea il database locale PostgreSQL e importa lo schema

set -e  # Exit on error

echo "=========================================="
echo "🚴 TerraGravel Database Setup"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DB_NAME=${DB_NAME:-terragravel}
DB_USER=${DB_USER:-postgres}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

echo "Configuration:"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo ""

# Check if PostgreSQL is running
echo "1️⃣  Checking PostgreSQL..."
if ! pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER > /dev/null 2>&1; then
    echo -e "${RED}❌ PostgreSQL is not running or not accessible${NC}"
    echo ""
    echo "Start PostgreSQL with:"
    echo "  macOS: brew services start postgresql"
    echo "  Linux: sudo systemctl start postgresql"
    echo "  Docker: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:15"
    exit 1
fi
echo -e "${GREEN}✅ PostgreSQL is running${NC}"
echo ""

# Check if database exists
echo "2️⃣  Checking if database exists..."
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo -e "${YELLOW}⚠️  Database '$DB_NAME' already exists${NC}"
    read -p "Do you want to drop and recreate it? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Dropping database..."
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "DROP DATABASE IF EXISTS $DB_NAME;"
        echo -e "${GREEN}✅ Database dropped${NC}"
    else
        echo "Skipping database creation"
        DB_EXISTS=true
    fi
fi

# Create database if it doesn't exist
if [ -z "$DB_EXISTS" ]; then
    echo "3️⃣  Creating database..."
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME;"
    echo -e "${GREEN}✅ Database created${NC}"
    echo ""
fi

# Enable PostGIS extension
echo "4️⃣  Enabling PostGIS extension..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS postgis;" > /dev/null
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";" > /dev/null
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;" > /dev/null
echo -e "${GREEN}✅ Extensions enabled${NC}"
echo ""

# Import schema
echo "5️⃣  Importing database schema..."
SCHEMA_FILE="$(dirname "$0")/../src/db/schema.sql"

if [ ! -f "$SCHEMA_FILE" ]; then
    echo -e "${RED}❌ Schema file not found: $SCHEMA_FILE${NC}"
    exit 1
fi

# Remove extension creation from schema (already created above)
cat "$SCHEMA_FILE" | grep -v "CREATE EXTENSION" | psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > /dev/null

echo -e "${GREEN}✅ Schema imported${NC}"
echo ""

# Verify tables
echo "6️⃣  Verifying tables..."
TABLE_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo "Tables created: $TABLE_COUNT"

if [ $TABLE_COUNT -lt 7 ]; then
    echo -e "${YELLOW}⚠️  Expected at least 7 tables, found $TABLE_COUNT${NC}"
else
    echo -e "${GREEN}✅ All tables created successfully${NC}"
fi
echo ""

# Show tables
echo "Tables in database:"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\dt"
echo ""

# Test PostGIS
echo "7️⃣  Testing PostGIS..."
POSTGIS_VERSION=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT PostGIS_Version();")
echo "PostGIS version: $POSTGIS_VERSION"
echo -e "${GREEN}✅ PostGIS working${NC}"
echo ""

echo "=========================================="
echo -e "${GREEN}🎉 Database setup completed!${NC}"
echo "=========================================="
echo ""
echo "Connection details for .env file:"
echo ""
echo "DB_HOST=$DB_HOST"
echo "DB_PORT=$DB_PORT"
echo "DB_USER=$DB_USER"
echo "DB_NAME=$DB_NAME"
echo "DB_SSL=false"
echo ""
echo "Or use DATABASE_URL:"
echo "DATABASE_URL=postgres://$DB_USER:your_password@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""
echo "Next steps:"
echo "  1. Copy backend/.env.example to backend/.env"
echo "  2. Update .env with your database password"
echo "  3. Run: npm install"
echo "  4. Run: npm run dev"
echo ""
