# 🏨 StaySync — Hotel Management System

**StaySync** is a unified, modern Hotel Management System (HMS) designed for independent hotels and boutique resorts. It centralizes bookings, front-desk operations, housekeeping, billing/POS, guest communications, and reporting—all in one seamless platform.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Database Setup](#database-setup)
  - [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Core Modules](#core-modules)
- [API Documentation](#api-documentation)
- [Architecture](#architecture)
  - [Database Schema](#database-schema)
  - [Key Design Patterns](#key-design-patterns)
- [Development Workflow](#development-workflow)
- [Deployment](#deployment)
- [Team Roles & Responsibilities](#team-roles--responsibilities)
- [Known Limitations](#known-limitations)
- [Contributing](#contributing)
- [Support](#support)

---

## ✨ Features

### Core Functionality

- **📅 Booking Management**: Create, modify, and manage reservations with automatic conflict detection
- **🏠 Room Management**: Track rooms by type, status, floor, and availability
- **👥 Guest Management**: Searchable guest database with profiles and booking history
- **📊 Tape Chart (Visual Calendar)**: Drag-and-drop booking visualization by room across dates
- **🧹 Housekeeping Module**: Task management with mobile-friendly interface for cleaning staff
- **💰 Folio & Billing**: Track charges, post to guest accounts, and manage payments
- **🛒 POS Integration**: Quick charge posting for additional services (restaurant, spa, laundry, etc.)
- **📄 Invoice Generation**: Automatic PDF invoicing for guest folios
- **💌 Guest Communications**: Automated emails for booking confirmation, pre-arrival welcome, and post-departure receipts
- **📈 Dynamic Pricing**: Nightly rate calculations with weekend surcharges and occupancy-based yield management
- **📉 Reporting**: Occupancy, revenue, room performance, and guest statistics dashboards
- **🔐 Role-Based Access Control**: Admin, Manager, Front Desk, Housekeeping, and POS staff roles
- **⚡ Real-Time Updates**: Live notifications via Laravel Broadcasting (Pusher/Soketi)

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | PHP 8.2 + Laravel 10 | RESTful API, business logic |
| **Frontend** | React 18 + Vite | Modern UI, fast builds |
| **State Management** | Zustand | Lightweight, performant store |
| **Database** | MySQL 8 | Data persistence |
| **Real-Time** | Laravel Broadcasting + Pusher/Soketi | Live updates |
| **Email** | Laravel Mail + Mailtrap/Mailgun | Guest communications |
| **PDF Generation** | DomPDF | Invoice generation |
| **UI Components** | Tailwind CSS + Headless UI | Styling and form components |
| **HTTP Client** | Axios | API requests |
| **Deployment** | Ubuntu VPS (DigitalOcean/AWS) + Nginx | Production hosting |

---

## 🚀 Getting Started

### Prerequisites

- **PHP**: 8.2+
- **Node.js**: 18+ (for frontend development)
- **MySQL**: 8.0+ or compatible database
- **Composer**: Latest version
- **Git**: For version control
- **npm or yarn**: Node package manager

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/Pkiachian/StaySync-HMS.git
cd StaySync-HMS
```

#### 2. Backend Setup (Laravel API)

```bash
# Navigate to backend directory
cd backend  # or wherever Laravel files are located

# Install dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Configure database in .env
# Edit .env and set:
# DB_DATABASE=staysync_db
# DB_USERNAME=root
# DB_PASSWORD=

# Install additional packages
composer require laravel/sanctum
composer require pusher/pusher-php-server
composer require barryvdh/laravel-dompdf

# Generate API token secret
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
```

#### 3. Frontend Setup (React)

```bash
# Navigate to frontend directory
cd ../frontend  # or wherever React files are located

# Install dependencies
npm install

# Create .env file for React
cat > .env << EOF
VITE_API_BASE_URL=http://localhost:8000
VITE_PUSHER_APP_KEY=your_pusher_key
VITE_PUSHER_APP_CLUSTER=mt1
EOF
```

### Database Setup

```bash
cd backend  # if not already there

# Run migrations
php artisan migrate

# Seed the database with sample data
php artisan db:seed

# Verify with:
php artisan tinker
# Then: DB::table('users')->get();
```

**Sample Data Created:**
- 4 Room Types (Standard, Deluxe, Suite, Presidential)
- 20 Rooms distributed across types and floors
- 5 Sample Guests
- 1 Admin User (email: `admin@staysync.com`, password: `password`)
- 1 User per role (front desk, housekeeping, pos_staff, manager)

### Running the Application

#### Terminal 1: Laravel Backend

```bash
cd backend
php artisan serve
# Runs at http://localhost:8000
```

#### Terminal 2: React Frontend

```bash
cd frontend
npm run dev
# Runs at http://localhost:5173
```

#### Terminal 3 (Optional): Laravel Queue Worker

```bash
cd backend
php artisan queue:work  # For email processing
```

#### Terminal 4 (Optional): Laravel Scheduler

```bash
cd backend
php artisan schedule:work  # For scheduled tasks (pre-arrival emails, housekeeping auto-tasks)
```

### First Login

1. Open http://localhost:5173 in your browser
2. Click "Login"
3. Use credentials from seeder:
   - **Email**: `admin@staysync.com`
   - **Password**: `password`
4. You'll be redirected to the Dashboard

---

## 📁 Project Structure

```
StaySync-HMS/
├── backend/                      # Laravel API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/
│   │   │   │   ├── AuthController.php
│   │   │   │   ├── BookingController.php
│   │   │   │   ├── RoomController.php
│   │   │   │   ├── GuestController.php
│   │   │   │   ├── HousekeepingController.php
│   │   │   │   ├── FolioController.php
│   │   │   │   ├── ReportController.php
│   │   │   │   └── SettingsController.php
│   │   │   ├── Requests/      # Form validation classes
│   │   │   └── Resources/     # API response formatting
│   │   ├── Models/            # Eloquent models
│   │   ├── Services/          # Business logic
│   │   │   ├── BookingService.php
│   │   │   ├── PricingEngine.php
│   │   │   ├── RoomStatusService.php
│   │   │   └── FolioService.php
│   │   ├── Events/            # Real-time events
│   │   ├── Mail/              # Email templates (PHP/Blade)
│   │   ├── Console/
│   │   │   ├── Kernel.php     # Scheduled tasks
│   │   │   └── Commands/
│   │   └── Exceptions/
│   ├── database/
│   │   ├── migrations/        # Database schema
│   │   └── seeders/           # Sample data
│   ├── routes/
│   │   └── api.php            # API routes
│   ├── resources/views/       # Blade templates (invoices, emails)
│   ├── storage/
│   └── tests/                 # Feature & unit tests
│
├── frontend/                      # React Vite App
│   ├── src/
│   │   ├── components/        # Reusable React components
│   │   ├── pages/             # Page components (Dashboard, Bookings, etc.)
│   │   ├── stores/            # Zustand stores
│   │   │   ├── authStore.js
│   │   │   ├── dashboardStore.js
│   │   │   ├── bookingStore.js
│   │   │   └── housekeepingStore.js
│   │   ├── hooks/             # Custom React hooks
│   │   ├── api/               # API client & services
│   │   ├── utils/             # Utility functions
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/                # Static assets
│   ├── package.json
│   └── vite.config.js
│
├── docs/                          # Documentation
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── DATABASE_SCHEMA.md
│
├── Project_plan                   # 2-week sprint plan
└── README.md                      # This file
```

---

## 🎯 Core Modules

### 1. **Authentication & Authorization**
- JWT-based API token authentication (Laravel Sanctum)
- Role-based access control (RBAC)
- User session management

**Key Endpoints:**
- `POST /api/login`
- `POST /api/logout`
- `GET /api/me`

### 2. **Room Management**
- Create, read, update, delete room types
- Manage individual rooms with status tracking
- View room availability for date ranges

**Key Endpoints:**
- `GET/POST /api/room-types`
- `GET/POST/PUT/DELETE /api/rooms`
- `PATCH /api/rooms/{id}/status`
- `GET /api/rooms/availability`

### 3. **Booking Management**
- Create bookings with automatic conflict detection (pessimistic locking)
- Modify booking dates or room assignments
- Complete booking lifecycle (confirmed → checked-in → checked-out)
- Support for walk-ins, cancellations, and no-shows

**Key Endpoints:**
- `GET/POST /api/bookings`
- `GET/PUT /api/bookings/{id}`
- `PATCH /api/bookings/{id}/check-in`
- `PATCH /api/bookings/{id}/check-out`
- `PATCH /api/bookings/{id}/cancel`

### 4. **Guest Management**
- Guest profiles with contact information
- Search and filter guests
- View booking history per guest

**Key Endpoints:**
- `GET/POST /api/guests`
- `GET/PUT /api/guests/{id}`

### 5. **Tape Chart (Visual Calendar)**
- Room × Date matrix visualization
- Color-coded booking blocks (by status)
- Click-to-create new booking, click-to-view booking detail
- Date range navigation

**Key Endpoint:**
- `GET /api/tape-chart?start_date=...&end_date=...`

### 6. **Housekeeping Module**
- Task assignment and tracking
- Priority levels (low, normal, urgent)
- Mobile-friendly interface for cleaning staff
- Auto-generation of tasks on checkout

**Key Endpoints:**
- `GET/POST /api/housekeeping/tasks`
- `PATCH /api/housekeeping/tasks/{id}`
- `PATCH /api/housekeeping/tasks/{id}/complete`

### 7. **Folio & Billing**
- Track all charges posted to guest accounts
- Post charges by category (room, restaurant, spa, minibar, laundry, etc.)
- Record payments with multiple methods (cash, card, bank transfer, online)
- Calculate outstanding balance

**Key Endpoints:**
- `GET /api/bookings/{id}/folio`
- `POST /api/bookings/{id}/charges`
- `POST /api/bookings/{id}/payments`

### 8. **POS (Point of Sale)**
- Quick charge posting interface
- Search checked-in guests by name or room number
- Categorized charges with notes

**UI Route:** `/pos`

### 9. **Invoicing**
- Generate PDF invoices for guest folios
- Itemized charges breakdown
- Payment history
- Professional layout with hotel branding

**Key Endpoint:**
- `GET /api/bookings/{id}/invoice`

### 10. **Dynamic Pricing**
- Base rate × number of nights calculation
- Weekend surcharge (15% on Fri/Sat)
- Occupancy-based yield management (surge pricing when occupancy > 85%)
- Manual rate overrides per date

**Key Endpoints:**
- `GET /api/rates`
- `POST/DELETE /api/rates/overrides`

### 11. **Guest Communications**
- Booking confirmation email
- Pre-arrival welcome email (1 day before check-in)
- Post-departure invoice email
- Automated scheduling via Laravel's task scheduler

**Email Templates:**
- `BookingConfirmationMail`
- `PreArrivalMail`
- `PostDepartureMail`

### 12. **Reporting & Analytics**
- Occupancy rate calculations
- Revenue tracking (daily/weekly/monthly)
- Room type performance metrics
- Guest statistics (top guests, repeat rate, average stay length)

**Key Endpoints:**
- `GET /api/reports/occupancy`
- `GET /api/reports/revenue`
- `GET /api/reports/room-type-performance`
- `GET /api/reports/guest-statistics`

---

## 📚 API Documentation

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

**Current Phase**: Week 2 Development (Billing, Polish, Testing, Deployment)

**Completion Estimate**: 2 weeks from project start

**Last Updated**: May 2026

---

**Built with ❤️ by the StaySync Development Team**
