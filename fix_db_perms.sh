#!/bin/bash
# Fix database permissions for research_user
# Run this as your user (not root), it will use sudo for postgres

echo "Fixing database permissions..."
echo "You may be asked for your sudo password."

sudo -u postgres psql <<'EOF'
-- Connect to the database
\c research_pilot

-- Drop all objects owned by research_user
DROP OWNED BY research_user CASCADE;

-- Recreate the user with proper permissions
DROP USER IF EXISTS research_user;
CREATE USER research_user WITH PASSWORD 'research_pass_2024';

-- Grant ALL privileges on the database
GRANT ALL PRIVILEGES ON DATABASE research_pilot TO research_user;

-- Grant ALL on schema public
GRANT ALL ON SCHEMA public TO research_user;

-- Grant default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO research_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO research_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TYPES TO research_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO research_user;

-- Grant CREATE privilege on database (needed for creating types)
GRANT CREATE ON DATABASE research_pilot TO research_user;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO research_user;

\q
EOF

echo ""
echo "✅ Database permissions fixed!"
echo ""
echo "Now run: ./run.sh"
