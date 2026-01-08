# Google AdSense API Server 🚀

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.19-blue.svg)](https://expressjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Production-ready Google AdSense V2 REST API** with **automatic token refresh**, comprehensive reporting, rate limiting, and enterprise-grade error handling.

---

## ✨ Features

- ✅ **Accounts** - List all AdSense accounts
- ✅ **Sites & Ad Units** - Complete inventory
- ✅ **Earnings Reports** - Custom dates, all metrics (RPM, CPC, CTR, etc.)
- ✅ **Website Analytics** - Group by date/domain/site
- ✅ **Site Reports** - Per-site performance tracking with user authorization
- ✅ **Payments & Alerts** - Financial data + notifications
- ✅ **Dashboard API** - Top sites, trends, key metrics
- ✅ **Auto Token Refresh** - Never expires (tokens.json)
- ✅ **Rate Limiting** - 100 req/15min
- ✅ **Security** - Helmet, CORS, input validation
- ✅ **Logging** - Winston with file rotation

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <repository-url>
cd google-adsense-api
npm install
```

### 2. Environment Setup

Create `.env` file:

```env
PORT=5000
NODE_ENV=development

# Frontend
FRONTEND_URL=http://localhost:3000

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000/api/adsense/auth/google/callback

# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/adsense-dashboard?retryWrites=true&w=majority

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
JWT_REFRESH_EXPIRE=30d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google AdSense Management API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add authorized redirect URI: `http://localhost:5000/api/adsense/auth/google/callback`
7. Copy **Client ID** and **Client Secret** to `.env`

Create `credentials.json`:

```json
{
  "web": {
    "client_id": "your_client_id",
    "project_id": "your_project_id",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "your_client_secret"
  }
}
```

### 4. Start Server

```bash
# Development
npm run dev

# Production
npm start
```

Server runs at `http://localhost:5000`

---

## 🔐 Authentication Flow

### Admin Authentication (One-time Setup)

The API uses a **single admin AdSense account** for fetching data. Users authenticate with JWT but share the admin's AdSense access.

**Initial Setup - Not implemented yet (manual token setup required):**

For now, you need to manually obtain tokens and place them in `tokens.json`.

### User Authentication

1. **Register User**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Pass@123",
  "confirmPassword": "Pass@123"
}
```

2. **Login**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Pass@123"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "websites": [],
      "role": "user",
      "lastLogin": "2025-01-08T12:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

3. **Use Access Token**
```bash
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## 📡 API Endpoints

### Authentication Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | Login user | ❌ |
| POST | `/api/auth/logout` | Logout user | ✅ |
| POST | `/api/auth/refresh-token` | Refresh access token | ❌ |
| GET | `/api/auth/profile` | Get user profile | ✅ |
| PATCH | `/api/auth/profile` | Update user profile | ✅ |
| PATCH | `/api/auth/change-password` | Change password | ✅ |
| POST | `/api/auth/websites` | Add website to user | ✅ |
| DELETE | `/api/auth/websites/:domain` | Remove website | ✅ |

### AdSense Routes

All AdSense routes require both **user authentication** and **admin AdSense authentication**.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/adsense/auth/check` | Check admin auth status |
| GET | `/api/adsense/accounts` | List all accounts |
| GET | `/api/adsense/sites/:accountId` | List sites |
| GET | `/api/adsense/adunits/:accountId` | List ad units |
| GET | `/api/adsense/earnings/:accountId` | Get earnings |
| GET | `/api/adsense/payments/:accountId` | Get payments |
| GET | `/api/adsense/alerts/:accountId` | Get alerts |

### Reporting Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/adsense/reports/websites/:accountId` | Comprehensive website report |
| GET | `/api/adsense/reports/site/:accountId/:siteId` | Site-specific report |
| GET | `/api/adsense/reports/dashboard/:accountId` | Dashboard summary |

---

## 📊 API Examples

### 1. Get Accounts

```bash
GET /api/adsense/accounts
Authorization: Bearer YOUR_ACCESS_TOKEN
```

Response:
```json
{
  "success": true,
  "data": {
    "accounts": [
      {
        "name": "accounts/pub-123456789",
        "displayName": "My AdSense Account",
        "createTime": "2020-01-01T00:00:00Z",
        "state": "READY"
      }
    ]
  }
}
```

### 2. Get Earnings Report

```bash
GET /api/adsense/earnings/pub-123456?startDate=2025-01-01&endDate=2025-01-07
Authorization: Bearer YOUR_ACCESS_TOKEN
```

Response:
```json
{
  "success": true,
  "data": {
    "headers": [
      { "name": "ESTIMATED_EARNINGS", "type": "METRIC_CURRENCY" },
      { "name": "IMPRESSIONS", "type": "METRIC_TALLY" },
      { "name": "CLICKS", "type": "METRIC_TALLY" },
      { "name": "COST_PER_CLICK", "type": "METRIC_CURRENCY" },
      { "name": "PAGE_VIEWS_RPM", "type": "METRIC_CURRENCY" }
    ],
    "rows": [
      {
        "cells": [
          { "value": "125.50" },
          { "value": "50000" },
          { "value": "250" },
          { "value": "0.50" },
          { "value": "2.51" }
        ]
      }
    ]
  }
}
```

### 3. Get Website Report

```bash
GET /api/adsense/reports/websites/pub-123456?startDate=2025-01-01&endDate=2025-01-07
Authorization: Bearer YOUR_ACCESS_TOKEN
```

Response:
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalEarnings": 450.75,
      "totalImpressions": 150000,
      "totalClicks": 750,
      "averageCPC": 0.60,
      "averageRPM": 3.00,
      "totalPageViews": 145000,
      "ctr": 0.50
    },
    "byWebsite": [
      {
        "domain": "example.com",
        "metrics": {
          "ESTIMATED_EARNINGS": 250.50,
          "IMPRESSIONS": 80000,
          "CLICKS": 400
        }
      },
      {
        "domain": "blog.example.com",
        "metrics": {
          "ESTIMATED_EARNINGS": 200.25,
          "IMPRESSIONS": 70000,
          "CLICKS": 350
        }
      }
    ],
    "byDate": [
      {
        "date": "2025-01-01",
        "metrics": {
          "ESTIMATED_EARNINGS": 65.50,
          "IMPRESSIONS": 21000
        }
      }
    ],
    "timeRange": {
      "startDate": "2025-01-01",
      "endDate": "2025-01-07"
    }
  },
  "metadata": {
    "accountId": "pub-123456",
    "startDate": "2025-01-01",
    "endDate": "2025-01-07"
  }
}
```

### 4. Get Site-Specific Report

**Important:** User must have the site added to their account.

```bash
# First, add website to user account
POST /api/auth/websites
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "domain": "example.com",
  "siteId": "sites/example.com",
  "accountId": "pub-123456"
}

# Then get the report
GET /api/adsense/reports/site/pub-123456/sites/example.com?startDate=2025-01-01&endDate=2025-01-07
Authorization: Bearer YOUR_ACCESS_TOKEN
```

Response:
```json
{
  "success": true,
  "data": {
    "siteInfo": {
      "domain": "example.com",
      "siteId": "sites/example.com",
      "accountId": "pub-123456",
      "addedAt": "2025-01-08T10:00:00.000Z"
    },
    "summary": {
      "totalEarnings": 250.50,
      "totalImpressions": 80000,
      "totalClicks": 400,
      "totalPageViews": 78000,
      "totalAdRequests": 79000,
      "averageCPC": 0.63,
      "averageRPM": 3.21,
      "ctr": 0.50
    },
    "byDate": [
      {
        "DATE": "2025-01-01",
        "ESTIMATED_EARNINGS": "35.50",
        "IMPRESSIONS": "11000",
        "CLICKS": "55"
      }
    ]
  }
}
```

### 5. Get Dashboard

```bash
GET /api/adsense/reports/dashboard/pub-123456?startDate=2025-01-01&endDate=2025-01-07
Authorization: Bearer YOUR_ACCESS_TOKEN
```

Response:
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalEarnings": 450.75,
      "totalImpressions": 150000,
      "totalClicks": 750,
      "averageCPC": 0.60,
      "averageRPM": 3.00,
      "ctr": 0.50
    },
    "topWebsites": [
      {
        "domain": "example.com",
        "metrics": {
          "ESTIMATED_EARNINGS": 250.50
        }
      }
    ],
    "recentTrends": [
      {
        "date": "2025-01-01",
        "metrics": {
          "ESTIMATED_EARNINGS": 65.50
        }
      }
    ],
    "activeSites": 5,
    "alerts": []
  }
}
```

---

## 🏗️ Project Structure

```
google-adsense-api/
├── src/
│   ├── config/
│   │   ├── constants.js          # App constants
│   │   ├── database.js            # MongoDB connection
│   │   └── googleAuth.js          # OAuth2 client
│   ├── controllers/
│   │   ├── adsense.controller.js  # AdSense endpoints
│   │   ├── auth.controller.js     # User auth endpoints
│   │   └── reporting.controller.js # Reporting endpoints
│   ├── middleware/
│   │   ├── auth.middleware.js     # JWT authentication
│   │   ├── errorHandler.middleware.js
│   │   ├── rateLimiter.middleware.js
│   │   └── validate.middleware.js
│   ├── models/
│   │   └── User.model.js          # User schema
│   ├── routes/
│   │   ├── adsense.routes.js      # AdSense routes
│   │   └── auth.routes.js         # Auth routes
│   ├── services/
│   │   ├── adsense.service.js     # AdSense API calls
│   │   └── auth.service.js        # Auth logic
│   ├── utils/
│   │   ├── jwt.utils.js           # JWT helpers
│   │   ├── logger.js              # Winston logger
│   │   ├── tokenManager.js        # Token management
│   │   └── validation.utils.js    # Joi schemas
│   ├── app.js                     # Express app
│   └── server.js                  # Entry point
├── logs/                          # Log files
├── .env                           # Environment variables
├── credentials.json               # Google OAuth credentials
├── tokens.json                    # Stored tokens
├── package.json
└── README.md
```

---

## 🔒 Security Features

1. **Helmet.js** - Security headers
2. **CORS** - Configurable origins
3. **Rate Limiting** - 100 requests per 15 minutes
4. **Input Validation** - Joi schemas
5. **JWT Authentication** - Secure user sessions
6. **Password Hashing** - bcrypt (12 rounds)
7. **Environment Variables** - Sensitive data protection

---

## 📝 User Model Schema

```javascript
{
  name: String,              // Required, 2-50 chars
  email: String,             // Required, unique, lowercase
  password: String,          // Required, 8+ chars, hashed
  websites: [                // User's websites
    {
      domain: String,
      siteId: String,
      accountId: String,
      isActive: Boolean,
      addedAt: Date
    }
  ],
  role: String,              // 'user' or 'admin'
  isActive: Boolean,         // Account status
  isEmailVerified: Boolean,
  lastLogin: Date,
  refreshToken: String,
  passwordChangedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔄 Token Management

The API automatically manages Google OAuth tokens:

1. **Initial Authentication** - Get tokens via OAuth flow
2. **Token Storage** - Saved in `tokens.json`
3. **Auto Refresh** - Refreshes 5 minutes before expiry
4. **Persistent** - Survives server restarts
5. **Refresh Token** - Never expires, stored permanently

**Token File Structure:**
```json
{
  "access_token": "ya29.a0...",
  "refresh_token": "1//04...",
  "scope": "https://www.googleapis.com/auth/adsense",
  "token_type": "Bearer",
  "expires_in": 3599,
  "expiry_date": 1767857781713,
  "created": 1767854181713
}
```

---

## 🌐 Available Metrics

```javascript
// Earnings Metrics
ESTIMATED_EARNINGS    // Total earnings ($)
IMPRESSIONS          // Ad impressions
CLICKS               // Ad clicks
COST_PER_CLICK       // Average CPC ($)
PAGE_VIEWS_RPM       // Revenue per 1000 page views ($)
PAGE_VIEWS           // Total page views
AD_REQUESTS          // Ad requests
AD_REQUESTS_COVERAGE // Coverage (%)
AD_REQUESTS_RPM      // RPM for ad requests ($)
MATCHED_AD_REQUESTS  // Matched requests
MATCHED_AD_REQUESTS_RPM // Matched RPM ($)
```

---

## 🧪 Testing with Postman/Thunder Client

### 1. Register User
```
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "Test@123",
  "confirmPassword": "Test@123"
}
```

### 2. Login
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Test@123"
}
```

Copy the `accessToken` from response.

### 3. Add Website
```
POST http://localhost:5000/api/auth/websites
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "domain": "example.com",
  "siteId": "sites/example.com",
  "accountId": "pub-123456"
}
```

### 4. Get Site Report
```
GET http://localhost:5000/api/adsense/reports/site/pub-123456/sites/example.com?startDate=2025-01-01&endDate=2025-01-07
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## ⚙️ Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `PORT` | No | Server port | `5000` |
| `NODE_ENV` | No | Environment | `development` |
| `FRONTEND_URL` | No | CORS origin | `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | Yes | OAuth client ID | - |
| `GOOGLE_CLIENT_SECRET` | Yes | OAuth secret | - |
| `GOOGLE_REDIRECT_URI` | Yes | OAuth redirect | - |
| `MONGODB_URI` | Yes | MongoDB connection | - |
| `JWT_SECRET` | Yes | JWT signing key | - |
| `JWT_EXPIRE` | No | Access token expiry | `7d` |
| `JWT_REFRESH_SECRET` | Yes | Refresh token key | - |
| `JWT_REFRESH_EXPIRE` | No | Refresh expiry | `30d` |
| `RATE_LIMIT_WINDOW_MS` | No | Rate limit window | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | No | Max requests | `100` |

---

## 🐛 Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/expired token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error
- `503` - Service Unavailable (admin auth required)

---

## 📊 Logging

Logs are stored in the `logs/` directory:

- `error.log` - Error-level logs only
- `combined.log` - All logs

**Log Format:**
```
2025-01-08 12:00:00 [info]: User logged in successfully {"userId":"123","email":"test@example.com"}
2025-01-08 12:01:00 [error]: Failed to fetch earnings {"accountId":"pub-123","error":"Invalid account"}
```

---

## 🚀 Deployment

### Deploy to Production

1. **Update Environment Variables**
```env
NODE_ENV=production
FRONTEND_URL=https://yourfrontend.com
GOOGLE_REDIRECT_URI=https://yourapi.com/api/adsense/auth/google/callback
```

2. **Build & Start**
```bash
npm start
```

3. **Use Process Manager (PM2)**
```bash
npm install -g pm2
pm2 start src/server.js --name adsense-api
pm2 startup
pm2 save
```

4. **Setup Reverse Proxy (Nginx)**
```nginx
server {
    listen 80;
    server_name yourapi.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📚 Additional Resources

- [Google AdSense Management API v2 Docs](https://developers.google.com/adsense/management/reference/rest/v2)
- [OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Your Name**

- GitHub: [@Kmakwana01](https://github.com/Kmakwana01)
- Email: kmakwana8232@gmail.com

---

## 🙏 Acknowledgments

- Google AdSense API Team
- Express.js Community
- All Contributors

---

## 📞 Support

For support, email kmakwana8232@gmail.com or open an issue on GitHub.

---

**Made with ❤️ using Node.js and Express**