# Harmony Music Streaming App - Deployment Guide

This guide will help you deploy the Harmony music streaming application on various platforms.

## 📋 Prerequisites

Before deploying, ensure you have:

- **Node.js** (v18 or higher)
- **Python 3** (v3.8 or higher) 
- **PostgreSQL Database** (local or cloud)
- **Git** for version control

## 🚀 Quick Deploy on Replit

### Step 1: Fork the Repository
1. Open the project on Replit
2. Click "Fork" to create your own copy
3. Wait for the environment to load

### Step 2: Environment Setup
The project will automatically install dependencies. If not, run:
```bash
npm install
```

### Step 3: Database Setup
The PostgreSQL database is already configured via Replit. Run:
```bash
npm run db:push
```

### Step 4: Start the Application
```bash
npm run dev
```

The app will be available at your Replit URL.

## 🌐 Deploy to Cloud Platforms

### Deploy to Vercel

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Build the project:**
```bash
npm run build
```

3. **Deploy:**
```bash
vercel --prod
```

4. **Environment Variables:**
Set these in your Vercel dashboard:
```
DATABASE_URL=your_postgresql_connection_string
NODE_ENV=production
```

### Deploy to Netlify

1. **Build the project:**
```bash
npm run build
```

2. **Deploy via Netlify CLI:**
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist/public
```

### Deploy to Railway

1. **Connect your GitHub repository to Railway**
2. **Set environment variables:**
```
DATABASE_URL=your_postgresql_connection_string
NODE_ENV=production
PORT=3000
```
3. **Railway will auto-deploy on git push**

## 🏠 Local Development Setup

### Step 1: Clone Repository
```bash
git clone <your-repository-url>
cd harmony-music-app
```

### Step 2: Install Dependencies
```bash
# Install Node.js dependencies
npm install

# Install Python dependencies (optional, for music processing)
pip install spotdl yt-dlp mutagen
```

### Step 3: Environment Configuration
Create a `.env` file in the root directory:
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/harmony_db

# Server
PORT=3000
NODE_ENV=development

# Optional: External API keys
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

### Step 4: Database Setup
```bash
# Push database schema
npm run db:push

# Optional: Seed database with sample data
npm run db:seed
```

### Step 5: Run Development Server
```bash
npm run dev
```

Access the application at `http://localhost:5000`

## 🗄️ Database Configuration

### PostgreSQL Setup

#### Local PostgreSQL
1. **Install PostgreSQL**
2. **Create database:**
```sql
CREATE DATABASE harmony_db;
CREATE USER harmony_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE harmony_db TO harmony_user;
```

#### Cloud Database Options
- **Neon Database** (Recommended)
- **Supabase**
- **PlanetScale**
- **AWS RDS**
- **Google Cloud SQL**

### Database Migration
```bash
# Apply schema changes
npm run db:push

# Generate migrations (if needed)
npm run db:generate

# View database in browser
npm run db:studio
```

## ⚙️ Configuration Options

### Server Configuration
Edit `server/config.js` or use environment variables:

```javascript
const config = {
  port: process.env.PORT || 3000,
  database: {
    url: process.env.DATABASE_URL
  },
  uploads: {
    maxFileSize: '50MB',
    allowedTypes: ['mp3', 'wav', 'flac']
  },
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5000'
  }
}
```

### Frontend Configuration
Edit `client/src/config.js`:

```javascript
export const config = {
  apiUrl: import.meta.env.VITE_API_URL || '/api',
  maxUploadSize: 50 * 1024 * 1024, // 50MB
  supportedFormats: ['mp3', 'wav', 'flac']
}
```

## 📦 Build for Production

### Create Production Build
```bash
npm run build
```

### Build Output
- Frontend assets: `dist/public/`
- Server bundle: `dist/server/`

### Serve Production Build
```bash
npm start
```

## 🔧 Python Dependencies (Optional)

For advanced music processing features:

```bash
# Install Python packages
pip install spotdl yt-dlp mutagen

# Or using requirements.txt
pip install -r requirements.txt
```

### Python Commands
```bash
# Download from Spotify
spotdl "song name artist name"

# Download from YouTube
yt-dlp https://youtube.com/watch?v=VIDEO_ID

# Process audio metadata
python scripts/process_audio.py
```

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check database URL
echo $DATABASE_URL

# Test database connection
npm run db:push
```

#### File Upload Errors
- Check file size limits (default: 50MB)
- Ensure `uploads/` directory exists
- Verify file permissions

#### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill

# Or use different port
PORT=3001 npm run dev
```

#### Build Failures
```bash
# Clear dependencies and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf dist/
npm run build
```

### Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | - | ✅ |
| `PORT` | Server port | 3000 | ❌ |
| `NODE_ENV` | Environment mode | development | ❌ |
| `VITE_API_URL` | Frontend API URL | /api | ❌ |

## 📊 Performance Optimization

### Frontend Optimization
- Enable Vite's production build optimizations
- Use lazy loading for large components
- Implement service worker for offline support
- Optimize image assets

### Backend Optimization
- Enable gzip compression
- Use connection pooling for database
- Implement caching strategies
- Set up CDN for static assets

### Database Optimization
- Add proper indexes
- Use connection pooling
- Monitor query performance
- Set up read replicas if needed

## 🔒 Security Considerations

### Production Security
- Set `NODE_ENV=production`
- Use HTTPS in production
- Configure proper CORS origins
- Set secure session cookies
- Validate all file uploads
- Rate limit API endpoints

### Environment Secrets
Never commit these to version control:
- Database passwords
- API keys
- Session secrets
- JWT tokens

## 📈 Monitoring and Logs

### Application Logs
```bash
# View application logs
npm run logs

# View with specific level
LOG_LEVEL=error npm run dev
```

### Health Checks
The application provides health check endpoints:
- `GET /health` - Basic health check
- `GET /api/status` - API status
- `GET /api/db-status` - Database connectivity

## 🆘 Support

### Getting Help
1. Check this deployment guide
2. Review application logs
3. Check database connectivity
4. Verify environment variables
5. Consult the main README.md for architecture details

### Useful Commands
```bash
# Full application restart
npm run restart

# Database reset (⚠️ destroys data)
npm run db:reset

# Run tests
npm test

# Check dependencies
npm audit
```

---

**Happy Deploying! 🎵**

For more technical details about the application architecture, see the main [README.md](README.md) file.