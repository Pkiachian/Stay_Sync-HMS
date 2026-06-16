# StaySync HMS

## First-time setup (colleagues)

`.env` files are intentionally **not** committed. After cloning:

```bash
# 1. Frontend env (required — Vite reads this at build/dev time)
cp .env.example .env
# Edit .env and set VITE_API_URL to your backend, e.g.:
#   VITE_API_URL=http://127.0.0.1:8000/api         (local Laravel on your machine)
#   VITE_API_URL=http://192.168.1.42:8000/api      (team-mate's machine on LAN)
#   VITE_API_URL=https://api.staysync.example/api  (deployed)

# 2. Backend env
cd backend
cp .env.example .env
php artisan key:generate
# Edit backend/.env: set DB_*, MAIL_*, MPESA_*, etc. for your machine.

# 3. Install deps
cd ..
npm install
cd backend && composer install

# 4. Run
composer run dev   # starts Laravel + queue + logs + Vite concurrently
```

If the frontend throws `VITE_API_URL is not set` on load, your `.env` is missing or you forgot to restart `npm run dev` after editing it.

CORS is configured in `backend/config/cors.php` to allow `localhost`, `127.0.0.1`, and any `192.168.x.x` / `10.x.x.x` LAN host by pattern. Add your origin there if you hit a CORS block.

---

### Authentication
All endpoints require the `Authorization` header with a Bearer token:

```bash
Authorization: Bearer {token}
```

Obtain a token via:
```bash
POST /api/login
Content-Type: application/json

{
  "email": "admin@staysync.com",
  "password": "password"
}

# Response
{
  "token": "1|abc123...",
  "user": { "id": 1, "name": "Admin", "email": "...", "role": "admin" }
}
```

### Response Format

All successful API responses return JSON:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

Errors return:

```json
{
  "success": false,
  "error": "Error message",
  "status": 400
}
```

### Complete Endpoint Reference

See **[API.md](./docs/API.md)** for the full endpoint reference with request/response examples.

---

## 🏗️ Architecture

### Database Schema Overview

**Core Tables:**

| Table | Purpose |
|-------|---------|
| `users` | System users with roles |
| `guests` | Guest profiles and contact info |
| `room_types` | Room categories (Standard, Deluxe, Suite) |
| `rooms` | Individual room records with status |
| `bookings` | Reservations with dates and pricing |
| `booking_addons` | Extra services (extra bed, airport pickup) |
| `folio_charges` | Guest account charges |
| `payments` | Payment records |
| `housekeeping_tasks` | Cleaning tasks with assignments |
| `room_status_logs` | Audit trail of room status changes |
| `rate_overrides` | Manual rate adjustments per date |
| `settings` | System configuration (hotel name, checkout time, tax rate) |

**Full Schema Diagram:** See **[DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md)**

### Key Design Patterns

#### 1. **Pessimistic Locking for Bookings**
Prevents double-booking by locking the room row during booking creation:

```php
$room = Room::where('id', $data['room_id'])
    ->lockForUpdate()
    ->firstOrFail();
```

#### 2. **Service Classes for Business Logic**
- `BookingService`: Handles booking creation, modification, and conflict detection
- `PricingEngine`: Calculates nightly rates with multipliers
- `RoomStatusService`: Centralizes room status updates and logging
- `FolioService`: Manages folio calculations and balance tracking

#### 3. **API Resources for Response Formatting**
Clean JSON responses with computed properties:

```php
class BookingResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'reference' => $this->booking_reference,
            'guest' => new GuestResource($this->guest),
            'room' => new RoomResource($this->room),
            'dates' => [...],
            'pricing' => [...]
        ];
    }
}
```

#### 4. **Real-Time Broadcasting with Events**
```php
event(new BookingCreated($booking));  // Broadcasts to all connected clients
event(new RoomStatusChanged($room));  // Tape chart updates instantly
```

#### 5. **Database Transactions for Data Integrity**
All multi-step operations (booking creation, checkout) wrapped in transactions.

---

## 👥 Development Workflow

### Daily Standup
**Time**: 15 minutes daily (morning before development)

**Format:**
1. What did I complete yesterday?
2. What am I working on today?
3. Any blockers?

### Git Workflow

**Branch Strategy:**
```
main (production)
  ↓
develop (integration branch)
  ↓
feature/* (feature branches)
```

**Commit Messages:**
```
[MODULE] Brief description

Example:
[BOOKING] Add pessimistic locking to prevent double-booking
[HOUSEKEEPING] Create mobile-friendly task list UI
[API] Implement tape-chart data endpoint
```

**Pull Request Process:**
1. Create feature branch from `develop`
2. Commit early and often
3. Push to GitHub
4. Open PR with description and screenshots (if UI change)
5. Code review by another team member
6. Merge to `develop` after approval

### Shared Resources

- **Postman Collection**: Request templates for all API endpoints
- **Mailtrap Account**: Email testing (dev environment)
- **Database Backup**: Weekly backups stored in AWS S3

### Communication

- **Daily Standup**: Slack/Discord at 10:00 AM
- **Blockers**: Immediate Slack notification
- **Code Reviews**: Within 2 hours during work hours
- **Emergency Issues**: Phone call

---

## 🚀 Deployment

### Production Environment

**Server Requirements:**
- Ubuntu 22.04 LTS
- PHP 8.2
- MySQL 8.0
- Nginx
- Node.js 18+
- SSL certificate (Let's Encrypt)

### Quick Deployment Guide

See **[DEPLOYMENT.md](./docs/DEPLOYMENT.md)** for:
- Server setup steps
- Laravel API deployment
- React frontend deployment
- Database migration strategy
- SSL setup
- Monitoring and logging

**Quick Start:**
```bash
# On production server

# Clone repo
git clone https://github.com/Pkiachian/StaySync-HMS.git
cd StaySync-HMS/backend

# Install & configure
composer install --no-dev --optimize-autoloader
cp .env.production .env
php artisan key:generate
php artisan migrate --force
php artisan db:seed --class=ProductionSeeder

# Cache configuration
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Setup Nginx, SSL, Supervisor for queues
# See DEPLOYMENT.md for details
```

---

## 👨‍💼 Team Roles & Responsibilities

| Role | Primary Responsibilities |
|------|--------------------------|
| **Backend Lead** | Laravel API, database schema, business logic, concurrency handling, deployment, code reviews, sprint management |
| **Frontend Developer** | React app, Tape Chart UI, all page layouts, Zustand state management, API integration |
| **Fullstack/Support** | Form validation, API resources, email templates, testing, database seeding, documentation |

**See Project_plan for detailed daily assignments.**

---

## ⚠️ Known Limitations

- **Single Property**: Designed for one hotel property (multi-property support is P3 stretch goal)
- **Manual Rate Overrides**: Yield management is basic; advanced algorithms not implemented
- **Email Queueing**: Requires background queue worker; sync sending will block requests
- **Real-Time Fallback**: If Pusher/Soketi is unavailable, falls back to polling (30-second intervals)
- **Tape Chart Columns**: Default 14-day view; very long date ranges may impact performance
- **Role-Based Features**: Admin features (reports, settings) not yet role-restricted in frontend

---

## 🤝 Contributing

1. **Report Bugs**: Create a GitHub issue with reproduction steps
2. **Feature Requests**: Open a GitHub discussion
3. **Code Contributions**: See Git Workflow section above

**Code Standards:**
- PHP: PSR-12 (enforced by Laravel)
- JavaScript: ESLint + Prettier
- Database: Zero timezone-aware timestamps with UTC
- API: Consistent JSON response format

---

## 📞 Support

### Getting Help

- **For Development Issues**: Check the [Project Plan](./Project_plan) for sprint assignments
- **For API Questions**: See [API.md](./docs/API.md)
- **For Deployment Help**: See [DEPLOYMENT.md](./docs/DEPLOYMENT.md)
- **Team Communication**: Slack/Discord channel

### Common Issues

**Issue**: `CORS error when fetching from frontend`
- **Solution**: Verify `.env` `APP_URL` matches frontend base URL, check CORS middleware in Laravel

**Issue**: `Real-time updates not working`
- **Solution**: Verify Pusher/Soketi credentials in `.env`, check browser console for connection errors

**Issue**: `Emails not sending`
- **Solution**: Verify Mailtrap credentials (dev), Mailgun/SES (prod), check `php artisan queue:work`

**Issue**: `Double booking still occurs`
- **Solution**: Verify database server isolation level (should be `READ COMMITTED` or higher)

---

## 📄 License

[LICENSE](./LICENSE)

---

## 📊 Project Status

**Current Phase**: Pre-deployment hardening (auth, secrets, money-path, M-Pesa).

**Last Updated**: June 2026

---

**Built with ❤️ by Alligator Mississipiensis**
