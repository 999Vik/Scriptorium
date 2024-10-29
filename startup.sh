#!/bin/bash

# Install dependencies
npm install

# Run Prisma migrations
npx prisma migrate dev --name init

# Check for required compilers/interpreters
command -v gcc >/dev/null 2>&1 || { echo >&2 "gcc is not installed. Aborting."; exit 1; }
command -v g++ >/dev/null 2>&1 || { echo >&2 "g++ is not installed. Aborting."; exit 1; }
command -v javac >/dev/null 2>&1 || { echo >&2 "javac is not installed. Aborting."; exit 1; }
command -v java >/dev/null 2>&1 || { echo >&2 "java is not installed. Aborting."; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo >&2 "python3 is not installed. Aborting."; exit 1; }
command -v node >/dev/null 2>&1 || { echo >&2 "Node.js is not installed. Aborting."; exit 1; }

# Create admin user
node scripts/createAdminUser.js