# 🚀 Deployment Guide

## Quick Deploy Links
- **Backend**: Deploy to Render 
- **Frontend**: Deploy to Vercel

## 📋 Prerequisites

1. **GitHub Repository**: Push your code to GitHub
2. **API Keys**: Have your Gemini API key ready
3. **Accounts**: Sign up for Render and Vercel (both have free tiers)

## 🔧 Backend Deployment (Render)

### Step 1: Prepare Your Backend
1. **Build the project locally** to verify:
   ```bash
   npm run build
   npm start
   ```

### Step 2: Deploy to Render
1. **Go to [render.com](https://render.com)** and sign up
2. **Create New Web Service**
3. **Connect your GitHub repository**
4. **Configure the service**:
   - **Name**: `ai-agent-backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free` (or paid for better performance)

### Step 3: Set Environment Variables
In Render dashboard, add these environment variables:
```
NODE_ENV=production
GEMINI_API_KEY=your_actual_gemini_api_key
PORT=10000
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
```

### Step 4: Deploy
- Click **"Create Web Service"**
- Wait for deployment (takes 5-10 minutes)
- Note your Render URL: `https://your-app-name.onrender.com`

## 🎨 Frontend Deployment (Vercel)

### Step 1: Update Frontend Configuration
Update the API URL in `index.html`:
```javascript
const API_BASE = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : 'https://YOUR_RENDER_APP_NAME.onrender.com';
```

### Step 2: Deploy to Vercel
1. **Go to [vercel.com](https://vercel.com)** and sign up
2. **Import your GitHub repository**
3. **Configure deployment**:
   - **Framework Preset**: `Other`
   - **Root Directory**: `./` (default)
   - **Build Command**: Leave empty (static site)
   - **Output Directory**: `./` (default)

### Step 3: Deploy
- Click **"Deploy"**
- Wait for deployment (takes 1-2 minutes)
- Note your Vercel URL: `https://your-app.vercel.app`

## 🔄 Update CORS Configuration

After getting your Vercel URL, update the backend environment variables on Render:
```
ALLOWED_ORIGINS=https://your-actual-vercel-url.vercel.app
```

## 🧪 Testing Your Deployment

1. **Backend Health Check**: Visit `https://your-render-app.onrender.com/health`
2. **Frontend**: Open your Vercel URL and test the chat
3. **Full Integration**: Send messages and verify responses

## 📁 Project Structure for Deployment

```
ai-agent-server/
├── src/                    # Backend source (TypeScript)
├── dist/                   # Compiled JavaScript (auto-generated)
├── index.html             # Frontend (single file)
├── package.json           # Node.js dependencies
├── tsconfig.json          # TypeScript config
├── render.yaml            # Render deployment config
├── vercel.json            # Vercel deployment config
├── .env.production        # Production environment template
└── DEPLOYMENT.md          # This guide
```

## 💡 Pro Tips

### Performance Optimization
- **Render**: Use paid plan for faster cold starts
- **Vercel**: Automatic edge caching for frontend

### Security
- Use HTTPS URLs only in production
- Keep API keys secure in environment variables
- Enable CORS only for your frontend domain

### Monitoring
- **Render**: Built-in logs and metrics
- **Vercel**: Analytics and performance insights

### Cost Optimization
- **Free Tier Limits**:
  - Render: 750 hours/month (sleeps after 15min idle)
  - Vercel: 100GB bandwidth, 6000 minutes build time

## 🔧 Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Update `ALLOWED_ORIGINS` environment variable
   - Ensure Vercel URL is correct

2. **Render App Sleeping**:
   - First request takes 30+ seconds (cold start)
   - Consider upgrading to paid plan

3. **API Connection Failed**:
   - Check Render app URL in frontend
   - Verify environment variables are set

4. **Build Failures**:
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json

### Debug Commands
```bash
# Test local build
npm run build && npm start

# Check environment variables
echo $GEMINI_API_KEY

# Test API endpoint
curl https://your-render-app.onrender.com/health
```

## 📞 Support

If you encounter issues:
1. Check Render/Vercel logs
2. Test locally first
3. Verify environment variables
4. Check CORS configuration

## 🎉 Success!

Your AI Agent is now live and accessible worldwide! 🌍

- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-app.onrender.com`
