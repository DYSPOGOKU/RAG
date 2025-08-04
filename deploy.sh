#!/bin/bash

# AI Agent Deployment Helper Script

echo "🚀 AI Agent Deployment Helper"
echo "==============================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Run this script from the project root."
    exit 1
fi

echo "📝 Pre-deployment checklist:"
echo "1. Build the project locally"
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed. Please fix errors before deploying."
    exit 1
fi

echo ""
echo "2. Testing the built application"
npm start &
SERVER_PID=$!
sleep 5

# Test health endpoint
echo "🔍 Testing health endpoint..."
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
fi

kill $SERVER_PID

echo ""
echo "🎯 Deployment Instructions:"
echo ""
echo "BACKEND (Render):"
echo "1. Go to https://render.com"
echo "2. Create new Web Service"
echo "3. Connect your GitHub repo"
echo "4. Use these settings:"
echo "   - Build Command: npm install && npm run build"
echo "   - Start Command: npm start"
echo "   - Environment Variables:"
echo "     * NODE_ENV=production"
echo "     * GEMINI_API_KEY=your_api_key"
echo "     * PORT=10000"
echo ""
echo "FRONTEND (Vercel):"
echo "1. Go to https://vercel.com"
echo "2. Import your GitHub repo"
echo "3. Deploy with default settings"
echo "4. Update the API URL in index.html with your Render URL"
echo ""
echo "📋 Don't forget to:"
echo "- Set ALLOWED_ORIGINS on Render to your Vercel URL"
echo "- Test both deployments"
echo "- Check CORS configuration"
echo ""
echo "🎉 Happy deploying!"
