# Deployment and Configuration

## Overview

This document outlines the deployment architecture, configuration management, and environment setup for the Acero Applications system. It provides detailed information on how to deploy the application in development, staging, and production environments.

## System Requirements

### Development Environment

- **Node.js**: v18.x or higher
- **npm**: v9.x or higher (or yarn v1.22+)
- **MongoDB**: v7.0+ configured in replica set mode
- **Git**: For version control
- **IDE**: Visual Studio Code recommended with extensions:
  - ESLint
  - Prettier
  - TypeScript
  - Tailwind CSS IntelliSense

### Production Environment

- **Server**: Linux-based environment (Ubuntu LTS recommended)
- **Node.js**: v18.x LTS
- **MongoDB**: v7.0+ in replica set configuration with appropriate resource allocation
- **Nginx**: For reverse proxy and static file serving
- **SSL Certificates**: For HTTPS configuration
- **RAM**: Minimum 8GB, recommended 16GB+
- **CPU**: Minimum 4 cores, recommended 8+ cores
- **Storage**: Minimum 100GB SSD

## Environment Configuration

### Environment Variables

The application uses environment variables for configuration, managed through `.env` files and environment-specific settings:

```plaintext
# Server Configuration
NODE_ENV=development
PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
SOCKET_PORT=4000

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017,localhost:27018,localhost:27019/acero?replicaSet=rs0
MONGODB_USER=admin
MONGODB_PASSWORD=password

# Authentication
JWT_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Email Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user
SMTP_PASSWORD=password
EMAIL_FROM=no-reply@acero.com

# File Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Feature Flags
ENABLE_SOCKET_SERVER=true
ENABLE_EMAIL_NOTIFICATIONS=true

# Additional Settings
LOG_LEVEL=info
DEFAULT_CURRENCY=USD
DEFAULT_LANGUAGE=en
```

### Configuration Management

The application uses a hierarchical configuration system:

1. **Base configuration**: Default settings applicable to all environments
2. **Environment overrides**: Settings specific to development, staging, or production
3. **Local overrides**: Developer-specific settings (not committed to version control)

Implementation:

```typescript
// src/config/index.ts
import dotenv from 'dotenv';

// Load environment-specific .env file
const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production' 
  : process.env.NODE_ENV === 'staging'
    ? '.env.staging'
    : '.env.development';

// Load local overrides if present
try {
  dotenv.config({ path: '.env.local' });
} catch (error) {
  // Local overrides are optional
}

// Load environment-specific settings
dotenv.config({ path: envFile });

// Configuration object
export const config = {
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
    socketPort: parseInt(process.env.SOCKET_PORT || '4000'),
  },
  database: {
    uri: process.env.MONGODB_URI,
    user: process.env.MONGODB_USER,
    password: process.env.MONGODB_PASSWORD,
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    nextAuthUrl: process.env.NEXTAUTH_URL,
    nextAuthSecret: process.env.NEXTAUTH_SECRET,
    sessionMaxAge: 8 * 60 * 60, // 8 hours
  },
  // Additional configuration sections
};
```

## Local Development Setup

### Setup Steps

1. **Clone the Repository**

```bash
git clone https://github.com/acero/applications.git
cd applications
```

2. **Install Dependencies**

```bash
npm install
```

3. **Set Up MongoDB Replica Set**

The application requires MongoDB running in replica set mode, even for development:

```bash
# Create data directories
mkdir -p ./data/db1 ./data/db2 ./data/db3

# Start MongoDB instances
mongod --replSet rs0 --port 27017 --dbpath ./data/db1 --logpath ./data/db1/mongo.log --fork
mongod --replSet rs0 --port 27018 --dbpath ./data/db2 --logpath ./data/db2/mongo.log --fork
mongod --replSet rs0 --port 27019 --dbpath ./data/db3 --logpath ./data/db3/mongo.log --fork

# Initialize replica set
mongo --port 27017 --eval "
rs.initiate({
  _id: 'rs0',
  members: [
    { _id: 0, host: 'localhost:27017' },
    { _id: 1, host: 'localhost:27018' },
    { _id: 2, host: 'localhost:27019' }
  ]
})
"
```

4. **Set Up Environment Variables**

Create a `.env.development` file with the necessary configuration (use the example above as reference).

5. **Run the Development Server**

```bash
npm run dev:socket
```

This starts both the Next.js development server and the Socket.IO server.

## Build and Deployment

### Build Process

The application is built using the Next.js build system:

```bash
npm run build
```

This creates an optimized production build in the `.next` directory.

### Deployment Options

#### Option 1: Standard Node.js Deployment

1. **Build the application**

```bash
npm run build
```

2. **Start the production server**

```bash
npm run start
```

3. **Set up process management**

Use PM2 for process management:

```bash
npm install -g pm2
pm2 start ecosystem.config.js
```

Example `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'acero-next',
      script: 'npm',
      args: 'start',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'acero-socket',
      script: 'npm',
      args: 'run socket',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        SOCKET_PORT: 4000
      }
    }
  ]
};
```

#### Option 2: Docker Deployment

The application includes Docker support for containerized deployment:

**Dockerfile**:

```dockerfile
FROM node:18-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/socket-server.js ./socket-server.js

EXPOSE 3000 4000

CMD ["npm", "run", "start:docker"]
```

**docker-compose.yml**:

```yaml
version: '3'

services:
  app:
    build: .
    restart: always
    ports:
      - "3000:3000"
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo1,mongo2,mongo3/acero?replicaSet=rs0
    depends_on:
      - mongo1
      - mongo2
      - mongo3
    volumes:
      - ./uploads:/app/uploads

  mongo1:
    image: mongo:6
    command: mongod --replSet rs0 --port 27017
    volumes:
      - mongo1_data:/data/db
    ports:
      - "27017:27017"

  mongo2:
    image: mongo:6
    command: mongod --replSet rs0 --port 27017
    volumes:
      - mongo2_data:/data/db

  mongo3:
    image: mongo:6
    command: mongod --replSet rs0 --port 27017
    volumes:
      - mongo3_data:/data/db

  mongo-init:
    image: mongo:6
    depends_on:
      - mongo1
      - mongo2
      - mongo3
    command: >
      bash -c "
        sleep 10 &&
        mongosh --host mongo1 --eval '
          rs.initiate({
            _id: \"rs0\",
            members: [
              {_id: 0, host: \"mongo1:27017\"},
              {_id: 1, host: \"mongo2:27017\"},
              {_id: 2, host: \"mongo3:27017\"}
            ]
          })
        '
      "

volumes:
  mongo1_data:
  mongo2_data:
  mongo3_data:
```

To deploy:

```bash
docker-compose up -d
```

## Server Configuration

### Nginx Configuration

For production deployments, Nginx is recommended as a reverse proxy:

```nginx
server {
    listen 80;
    server_name acero.example.com;

    # Redirect HTTP to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name acero.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Next.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.IO server
    location /socket.io/ {
        proxy_pass http://localhost:4000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files
    location /_next/static/ {
        alias /path/to/app/.next/static/;
        expires 365d;
        access_log off;
    }

    # Uploads
    location /uploads/ {
        alias /path/to/app/uploads/;
        expires 30d;
        access_log off;
    }
}
```

## Database Management

### MongoDB Replica Set

The application requires MongoDB in replica set mode for transaction support:

1. **Production Setup**:
   - Minimum 3-node replica set for high availability
   - Proper authentication and network security
   - Regular backups

2. **Backup Strategy**:
   - Daily automated backups
   - Offsite backup storage
   - Regular restore testing

3. **Monitoring**:
   - MongoDB performance metrics
   - Disk space monitoring
   - Connection pooling statistics

## Maintenance Procedures

### Regular Updates

Process for applying updates:

1. Pull latest code changes
2. Install dependencies
3. Run database migrations if necessary
4. Build the application
5. Restart services

### Database Migrations

The application includes a migration system for database schema changes:

```bash
# Run pending migrations
npm run migrate

# Create a new migration
npm run migrate:create -- --name add-new-field
```

### Backup and Restore

Database backup:

```bash
mongodump --uri="mongodb://username:password@host:port/acero?replicaSet=rs0" --out=backup/$(date +%Y-%m-%d)
```

Database restore:

```bash
mongorestore --uri="mongodb://username:password@host:port/acero?replicaSet=rs0" backup/2023-05-01
```

## Scaling Strategies

### Horizontal Scaling

1. **Next.js Application**:
   - Multiple instances behind load balancer
   - Stateless design for easy scaling

2. **Socket.IO**:
   - Redis adapter for multi-instance support
   - Sticky sessions for connection persistence

3. **MongoDB**:
   - Read replicas for read-heavy workloads
   - Sharding for very large datasets

### Vertical Scaling

Guidelines for resource allocation:

1. **Memory Optimization**:
   - Node.js heap size tuning
   - MongoDB memory allocation

2. **CPU Optimization**:
   - Worker thread utilization
   - Process clustering

## Monitoring and Logging

### Application Monitoring

The application implements comprehensive monitoring:

1. **Performance Metrics**:
   - API response times
   - Database query performance
   - Page load times

2. **Error Tracking**:
   - Centralized error logging
   - Error notification system
   - Error rate monitoring

### Logging Strategy

```typescript
// src/utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ],
});

export default logger;
```

## Disaster Recovery

### Recovery Procedures

1. **Database Failure**:
   - Automatic failover to replica nodes
   - Manual recovery process documented

2. **Application Failure**:
   - Automated restart through process manager
   - Rollback procedures for failed deployments

3. **Complete System Recovery**:
   - Infrastructure as code for environment setup
   - Regular recovery testing
