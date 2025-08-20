# 🚀 Deploying to Render.com

This guide will walk you through deploying the Bitespeed Contact Identifier service to Render.com's free tier.

## 🐳 **Why Docker is Recommended for This Project**

Your project is already containerized with:
- ✅ **Dockerfile** - Optimized for production
- ✅ **docker-compose.yml** - Multi-service setup
- ✅ **Health checks** - Custom health monitoring
- ✅ **PostgreSQL integration** - Database containerization

**Using Docker on Render.com means:**
- 🚀 **Faster deployments** - No dependency installation during build
- 🔒 **Identical environment** - Same as your local development
- 📦 **Self-contained** - All dependencies included in image
- 🏥 **Better monitoring** - Uses your custom healthcheck.js
- 🔄 **Easier debugging** - Same container locally and on Render

## 📋 Prerequisites

1. **GitHub Account** - Your code must be in a GitHub repository
2. **Render.com Account** - Sign up at [render.com](https://render.com)
3. **Database** - You'll need a PostgreSQL database (Render provides this)

## 🔧 Step-by-Step Deployment

### Step 1: Prepare Your Repository

Ensure your repository has all the necessary files:
- ✅ `package.json` with proper scripts
- ✅ `Dockerfile` (optional for Render)
- ✅ Environment variables documented
- ✅ Health check endpoint (`/health`)

### Step 2: Create a Render Account

1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account
3. Verify your email address

### Step 3: Create a New Web Service

1. **Click "New +"** in your Render dashboard
2. **Select "Web Service"**
3. **Connect your GitHub repository**
4. **Choose the repository** containing your code

### Step 4: Configure the Web Service

#### Basic Settings
- **Name**: `bitespeed-contact-identifier` (or your preferred name)
- **Environment**: `Docker` (Recommended) or `Node`
- **Region**: Choose closest to your users
- **Branch**: `main` (or your default branch)

#### Option A: Docker Environment (Recommended for Containerized Apps)
**Environment**: `Docker`

**Build & Deploy Settings**:
- **Build Command**: Leave empty (Render uses your Dockerfile)
- **Start Command**: Leave empty (Render uses your Dockerfile)
- **Root Directory**: Leave empty (root of repo)

**Why Docker?**:
- ✅ Consistent with your local Docker setup
- ✅ Faster deployments (no need to install dependencies)
- ✅ Better performance and reliability
- ✅ Matches your development environment exactly

#### Option B: Node.js Environment (Alternative)
**Environment**: `Node`

**Build & Deploy Settings**:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Root Directory**: Leave empty (root of repo)

**When to use Node.js**:
- ⚠️ If you want Render to handle the build process
- ⚠️ If you prefer not to use Docker
- ⚠️ For simpler deployments (but slower builds)

### Step 4.5: Docker-Specific Configuration (If using Docker Environment)

If you chose **Docker Environment**, your deployment will be much simpler:

#### What Render Does Automatically:
1. **Reads your Dockerfile** from the repository
2. **Builds the Docker image** using your Dockerfile
3. **Runs the container** with proper port mapping
4. **Handles health checks** using your HEALTHCHECK directive

#### Your Dockerfile Should Include:
```dockerfile
# These are already in your Dockerfile:
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js
CMD ["npm", "start"]
```

#### Benefits of Docker Deployment:
- 🚀 **Faster builds** - No dependency installation during build
- 🔒 **Consistent environment** - Same as your local development
- 📦 **Self-contained** - All dependencies included in image
- 🏥 **Better health checks** - Uses your custom healthcheck.js
- 🔄 **Easier rollbacks** - Image-based deployments

#### Environment Variables for Docker:
```bash
NODE_ENV=production
PORT=10000  # Render will set this automatically
DB_HOST=your-postgres-host.render.com
DB_PORT=5432
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
```

**Note**: When using Docker, Render automatically sets the `PORT` environment variable and maps it to your container's exposed port (3000).

#### Environment Variables
Add these environment variables:

```bash
NODE_ENV=production
PORT=10000
DB_HOST=your-postgres-host.render.com
DB_PORT=5432
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
```

### Step 5: Create PostgreSQL Database

1. **Click "New +"** again
2. **Select "PostgreSQL"**
3. **Configure database:**
   - **Name**: `bitespeed-contacts-db`
   - **Database**: `bitespeed_contacts`
   - **User**: Auto-generated
   - **Region**: Same as your web service

4. **Copy connection details** to your web service environment variables

### Step 6: Update Environment Variables

Go back to your web service and update the database environment variables with the actual values from your PostgreSQL service:

```bash
DB_HOST=your-actual-postgres-host.render.com
DB_NAME=your_actual_db_name
DB_USER=your_actual_db_user
DB_PASSWORD=your_actual_db_password
```

### Step 7: Deploy

1. **Click "Create Web Service"**
2. **Wait for build** (usually 2-5 minutes)
3. **Check build logs** for any errors
4. **Verify deployment** by visiting your service URL

## 🔍 Post-Deployment Verification

### 1. Health Check
```bash
curl https://your-service-name.onrender.com/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2023-12-01T10:00:00.000Z",
  "service": "Bitespeed Contact Identifier"
}
```

### 2. Test the Identify Endpoint
```bash
curl -X POST https://your-service-name.onrender.com/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "phoneNumber": "1234567890"}'
```

### 3. Check Logs
- Go to your service dashboard
- Click on "Logs" tab
- Look for any errors or warnings

## 🛠️ Troubleshooting

### Common Issues

#### 1. Build Failures
**Problem**: Build command fails
**Solution**: 
- Check `package.json` has correct scripts
- Ensure all dependencies are in `dependencies` (not `devDependencies`)
- Verify Node.js version compatibility

#### 2. Database Connection Issues
**Problem**: Service can't connect to database
**Solution**:
- Verify environment variables are correct
- Check database is running
- Ensure database allows connections from your service

#### 3. Service Won't Start
**Problem**: Service starts but immediately crashes
**Solution**:
- Check start command (`npm start`)
- Verify `dist/` folder exists after build
- Check logs for specific error messages

#### 4. Environment Variable Issues
**Problem**: Service can't read environment variables
**Solution**:
- Ensure all required variables are set
- Check variable names match your code
- Restart service after adding variables

#### 5. Docker-Specific Issues (If using Docker Environment)
**Problem**: Docker build fails
**Solution**:
- Check your Dockerfile syntax
- Ensure all files referenced in Dockerfile exist
- Verify the Dockerfile is in the root directory

**Problem**: Container starts but service isn't accessible
**Solution**:
- Verify your Dockerfile exposes port 3000
- Check that your app listens on 0.0.0.0, not localhost
- Ensure the CMD in Dockerfile is correct

**Problem**: Health check fails
**Solution**:
- Verify healthcheck.js exists and is executable
- Check that healthcheck.js can access your service
- Ensure the HEALTHCHECK directive in Dockerfile is correct

### Debug Commands

```bash
# Check if service is responding
curl -v https://your-service-name.onrender.com/health

# Test database connection (if you have access)
psql -h your-db-host -U your-user -d your-db-name
```

## 📊 Monitoring & Maintenance

### 1. **Auto-Deploy**
- Render automatically redeploys when you push to your main branch
- You can disable this in settings if needed

### 2. **Logs**
- Monitor logs regularly for errors
- Set up alerts for critical failures

### 3. **Scaling**
- Free tier: 1 instance, 750 hours/month
- Paid tiers: Multiple instances, custom domains, SSL

### 4. **Backups**
- Database backups are automatic on paid plans
- Free tier: Manual backups recommended

## 🔒 Security Considerations

### 1. **Environment Variables**
- Never commit sensitive data to Git
- Use Render's environment variable system
- Rotate database passwords regularly

### 2. **Database Access**
- Restrict database access to your service only
- Use strong, unique passwords
- Consider using connection pooling for production

### 3. **HTTPS**
- Render provides free SSL certificates
- All traffic is encrypted by default

## 💰 Cost Optimization

### Free Tier Limits
- **Web Services**: 750 hours/month
- **Databases**: 90 days free trial
- **Bandwidth**: 100GB/month

### Paid Tier Benefits
- **Always-on services**
- **Custom domains**
- **Advanced monitoring**
- **Priority support**

## 📱 Custom Domain (Optional)

1. **Go to your service settings**
2. **Click "Custom Domains"**
3. **Add your domain**
4. **Update DNS records** as instructed
5. **Wait for SSL certificate** (usually 24-48 hours)

## 🔄 Continuous Deployment

### GitHub Integration
- Every push to main branch triggers deployment
- Build logs are available in real-time
- Rollback to previous versions easily

### Manual Deploy
- Go to your service dashboard
- Click "Manual Deploy"
- Choose branch/commit to deploy

## 📞 Support

### Render Support
- **Documentation**: [docs.render.com](https://docs.render.com)
- **Community**: [community.render.com](https://community.render.com)
- **Email**: support@render.com

### Common Resources
- [Node.js on Render](https://render.com/docs/deploy-node-express-app)
- [PostgreSQL on Render](https://render.com/docs/deploy-postgresql)
- [Environment Variables](https://render.com/docs/environment-variables)

---

## 🎯 Quick Deploy Checklist

- [ ] Code pushed to GitHub
- [ ] Render account created
- [ ] Web service configured
- [ ] PostgreSQL database created
- [ ] Environment variables set
- [ ] Service deployed successfully
- [ ] Health check passing
- [ ] Identify endpoint tested
- [ ] Logs monitored
- [ ] Documentation updated

Your service should now be live at: `https://your-service-name.onrender.com` 🚀
