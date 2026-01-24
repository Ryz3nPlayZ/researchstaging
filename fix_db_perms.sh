#!/bin/bash
# Fix database permissions for research_user

sudo -u postgres psql <<'SQL'
-- Grant necessary permissions to research_user
GRANT ALL PRIVILEGES ON DATABASE research_pilot TO research_user;
GRANT ALL ON SCHEMA public TO research_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO research_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO research_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TYPES TO research_user;
GRANT CREATE ON DATABASE research_pilot TO research_user;
SQL

echo "✅ Database permissions fixed!"
