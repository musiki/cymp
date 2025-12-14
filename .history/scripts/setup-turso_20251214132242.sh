#!/bin/bash

# Quick Setup Script for Turso Database
# Run this script to setup your production database

echo "🚀 Setting up Turso Database for Production"
echo ""

# Check if turso CLI is installed
if ! command -v turso &> /dev/null; then
    echo "❌ Turso CLI not found. Installing..."
    brew install tursodatabase/tap/turso
else
    echo "✅ Turso CLI already installed"
fi

echo ""
echo "📝 Please login to Turso (this will open your browser):"
turso auth signup

echo ""
echo "🗄️  Creating database 'cymp-production'..."
turso db create cymp-production

echo ""
echo "📊 Getting database URL..."
turso db show cymp-production

echo ""
echo "🔑 Creating auth token..."
turso db tokens create cymp-production

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy the URL and Token from above"
echo "2. Add them to Vercel Environment Variables:"
echo "   - ASTRO_DB_REMOTE_URL=<the-url-from-above>"
echo "   - ASTRO_STUDIO_APP_TOKEN=<the-token-from-above>"
echo "3. Push your schema: astro db push --remote"
echo "4. Deploy to Vercel!"
echo ""
echo "💡 Tip: Keep these credentials safe!"
