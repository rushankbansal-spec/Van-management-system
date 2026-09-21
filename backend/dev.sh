#!/bin/bash
set -e

echo "🚀 Starting Docker containers (Postgres & Redis)..."
docker-compose up -d postgres redis

if [ ! -f .env ]; then
  echo "📄 Copying .env.example to .env..."
  cp .env.example .env
fi

echo "⚡ Running Prisma migrations & seeding database..."
npx prisma migrate dev
# npx ts-node prisma/seed.ts

echo "📡 Starting server in dev mode..."
npm run start:dev
