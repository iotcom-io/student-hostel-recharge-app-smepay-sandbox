# Deployment Guide - recharge.iotcom.io

## 🚀 Production Deployment

### Architecture
```
Frontend: https://recharge.iotcom.io (Static files)
Backend:  https://recharge.iotcom.io/api (Reverse proxy to backend)
```

### Prerequisites
- Server with Node.js installed
- MongoDB installed and running
- Nginx or Apache for reverse proxy
- SSL certificate for HTTPS

---

## 📦 Step 1: Deploy Backend

### 1.1 Upload Backend Files
```bash
# On your local machine
scp -r ./backend root@recharge.iotcom.io:/var/www/hostel-recharge/
```

### 1.2 Install Dependencies
```bash
# On server
cd /var/www/hostel-recharge/backend
npm install
```

### 1.3 Configure Environment
Create `.env` file:
```env
PORT=4500
NODE_ENV=production
MONGO_URI=mongodb://localhost:27017/hostelapp
JWT_SECRET=your_secure_random_secret_here
SMEPAY_API_URL=https://staging.smepay.in/api
SMEPAY_CLIENT_ID=0d61e2d0403A78EF
SMEPAY_CLIENT_SECRET=your_secret_here
```

### 1.4 Start Backend with PM2
```bash
# Install PM2 globally
npm install -g pm2

# Start backend
pm2 start server.js --name hostel-backend

# Save PM2 configuration
pm2 save

# Setup startup script
pm2 startup
```

---

## 🌐 Step 2: Deploy Frontend

### 2.1 Build Frontend Locally
```bash
# On your local machine
cd frontend
node build.js
```

### 2.2 Upload Frontend Files
```bash
# Upload dist folder
scp -r ./frontend/dist/* root@recharge.iotcom.io:/var/www/hostel-recharge/frontend/
```

---

## ⚙️ Step 3: Configure Nginx

### 3.1 Create Nginx Configuration
Create file: `/etc/nginx/sites-available/recharge.iotcom.io`

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name recharge.iotcom.io;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name recharge.iotcom.io;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/recharge.iotcom.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/recharge.iotcom.io/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Frontend - Serve static files
    root /var/www/hostel-recharge/frontend;
    index index.html;

    # Frontend files
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "public, max-age=3600";
    }

    # Backend API - Reverse proxy
    location /api/ {
        proxy_pass http://localhost:4500/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeout for payment processing
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### 3.2 Enable Site and Restart Nginx
```bash
# Create symbolic link
ln -s /etc/nginx/sites-available/recharge.iotcom.io /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Restart Nginx
systemctl restart nginx
```

---

## 🔒 Step 4: Setup SSL Certificate

### Using Let's Encrypt (Certbot)
```bash
# Install Certbot
apt install certbot python3-certbot-nginx

# Obtain certificate
certbot --nginx -d recharge.iotcom.io

# Auto-renewal is configured automatically
# Test renewal
certbot renew --dry-run
```

---

## 🗄️ Step 5: Setup MongoDB

### 5.1 Install MongoDB
```bash
# Install MongoDB
apt install mongodb

# Start MongoDB
systemctl start mongodb
systemctl enable mongodb
```

### 5.2 Create Database User (Optional but Recommended)
```bash
mongo
```

```javascript
use hostelapp
db.createUser({
  user: "hosteluser",
  pwd: "secure_password_here",
  roles: [{ role: "readWrite", db: "hostelapp" }]
})
```

Update `.env` with:
```env
MONGO_URI=mongodb://hosteluser:secure_password_here@localhost:27017/hostelapp
```

---

## ✅ Step 6: Verify Deployment

### 6.1 Check Services
```bash
# Check backend
pm2 status
pm2 logs hostel-backend

# Check Nginx
systemctl status nginx

# Check MongoDB
systemctl status mongodb
```

### 6.2 Test Application
1. Open browser: `https://recharge.iotcom.io`
2. Login with admin credentials
3. Add a test student
4. Login as student
5. Try recharge flow
6. Verify payment processing

### 6.3 Check API Base URL
Open browser console and check:
```javascript
console.log(API_BASE); // Should show: https://recharge.iotcom.io/api
```

---

## 🔄 Update Deployment

### Update Backend
```bash
# On local machine
scp -r ./backend root@recharge.iotcom.io:/var/www/hostel-recharge/

# On server
cd /var/www/hostel-recharge/backend
npm install
pm2 restart hostel-backend
```

### Update Frontend
```bash
# On local machine
cd frontend
node build.js
scp -r ./dist/* root@recharge.iotcom.io:/var/www/hostel-recharge/frontend/

# No server restart needed for frontend
```

---

## 📊 Monitoring

### PM2 Monitoring
```bash
# View logs
pm2 logs hostel-backend

# Monitor resources
pm2 monit

# View detailed info
pm2 info hostel-backend
```

### Nginx Logs
```bash
# Access log
tail -f /var/log/nginx/access.log

# Error log
tail -f /var/log/nginx/error.log
```

### Application Logs
```bash
# Backend logs
tail -f /var/www/hostel-recharge/backend/logs/app.log
```

---

## 🐛 Troubleshooting

### Backend Not Starting
```bash
# Check logs
pm2 logs hostel-backend --lines 100

# Check port
netstat -tulpn | grep 4500

# Test manually
cd /var/www/hostel-recharge/backend
node server.js
```

### API 502 Bad Gateway
```bash
# Check if backend is running
pm2 status

# Check Nginx error log
tail -f /var/log/nginx/error.log

# Test backend directly
curl http://localhost:4500/api
```

### MongoDB Connection Error
```bash
# Check MongoDB status
systemctl status mongodb

# Check connection
mongo --eval "db.version()"

# Restart MongoDB
systemctl restart mongodb
```

### SSL Certificate Issues
```bash
# Check certificate
certbot certificates

# Renew certificate
certbot renew

# Test renewal
certbot renew --dry-run
```

---

## 🔐 Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT secret
- [ ] Enable MongoDB authentication
- [ ] Configure firewall (ufw/iptables)
- [ ] Setup fail2ban for SSH
- [ ] Regular security updates
- [ ] Backup database regularly
- [ ] Monitor logs for suspicious activity
- [ ] Use environment variables for secrets
- [ ] Enable HTTPS only

---

## 🔥 Firewall Configuration

```bash
# Allow SSH
ufw allow 22

# Allow HTTP
ufw allow 80

# Allow HTTPS
ufw allow 443

# Enable firewall
ufw enable

# Check status
ufw status
```

---

## 💾 Backup Strategy

### Automated MongoDB Backup
```bash
#!/bin/bash
# /usr/local/bin/backup-hostel-db.sh

BACKUP_DIR="/var/backups/hostel-db"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
mongodump --db hostelapp --out $BACKUP_DIR/backup_$DATE

# Keep only last 7 days
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} +
```

### Setup Cron Job
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /usr/local/bin/backup-hostel-db.sh
```

---

## 📝 Environment Variables Summary

### Production .env
```env
# Server
PORT=4500
NODE_ENV=production

# Database
MONGO_URI=mongodb://localhost:27017/hostelapp

# Security
JWT_SECRET=use_long_random_secure_string_here

# SME Pay (Production)
SMEPAY_API_URL=https://extranet.smepay.in/api
SMEPAY_CLIENT_ID=your_production_client_id
SMEPAY_CLIENT_SECRET=your_production_client_secret
```

---

## ✨ Post-Deployment

1. Test all functionality thoroughly
2. Monitor error logs for 24 hours
3. Check payment gateway integration
4. Verify webhook callbacks are working
5. Test on multiple devices/browsers
6. Setup monitoring alerts
7. Document any custom configurations
8. Share credentials with team securely

---

**Deployment Complete! 🎉**

Your application should now be live at: **https://recharge.iotcom.io**
