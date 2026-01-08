# Google AdSense API Server 🚀

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.19-blue.svg)](https://expressjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Production-ready Google AdSense V2 REST API** with **automatic token refresh**, comprehensive reporting, rate limiting, and enterprise-grade error handling.

## ✨ Features

- ✅ **Accounts** - List all AdSense accounts
- ✅ **Sites & Ad Units** - Complete inventory
- ✅ **Earnings Reports** - Custom dates, all metrics (RPM, CPC, CTR, etc.)
- ✅ **Website Analytics** - Group by date/domain/site
- ✅ **Site Reports** - Per-site performance tracking
- ✅ **Payments & Alerts** - Financial data + notifications
- ✅ **Dashboard API** - Top sites, trends, key metrics
- ✅ **Auto Token Refresh** - Never expires (`tokens.json`)
- ✅ **Rate Limiting** - 100 req/15min
- ✅ **Security** - Helmet, CORS, input validation
- ✅ **Logging** - Winston with file rotation

## 🛠 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/Kmakwana01/google-adsense-api.git
cd google-adsense-api
npm install
npm start
