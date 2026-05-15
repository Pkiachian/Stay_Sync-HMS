DROP DATABASE IF EXISTS Staysync_hms;
CREATE DATABASE Staysync_hms;
USE Staysync_hms;

-- =====================================================
-- 1. ROOM TYPES
-- =====================================================
CREATE TABLE room_types (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE,
  base_rate DECIMAL(10,2) NOT NULL,
  max_occupancy INT NOT NULL,
  description TEXT NULL,
  amenities JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. ROOMS
-- =====================================================
CREATE TABLE rooms (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  room_type_id BIGINT NOT NULL,
  room_number VARCHAR(20) NOT NULL UNIQUE,
  floor INT NULL,
  status ENUM('available','occupied','maintenance','cleaning') DEFAULT 'available',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (room_type_id) REFERENCES room_types(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

-- =====================================================
-- 3. USERS (AUTH)
-- =====================================================
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100),
  email VARCHAR(150) UNIQUE,
  password VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. ROLES & PERMISSIONS (RBAC)
-- =====================================================
CREATE TABLE roles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) UNIQUE,
  description TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) UNIQUE,
  description TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role_user (
  user_id BIGINT,
  role_id BIGINT,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

CREATE TABLE permission_role (
  permission_id BIGINT,
  role_id BIGINT,
  PRIMARY KEY (permission_id, role_id),
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- =====================================================
-- 5. GUESTS
-- =====================================================
CREATE TABLE guests (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(150) UNIQUE,
  phone VARCHAR(30),
  country VARCHAR(100),
  loyalty_tier VARCHAR(50) DEFAULT 'standard',
  total_stays INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 6. BOOKINGS
-- =====================================================
CREATE TABLE bookings (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  booking_reference VARCHAR(50) UNIQUE,
  guest_id BIGINT NOT NULL,
  room_id BIGINT NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  status ENUM('confirmed','checked_in','checked_out','cancelled','no_show') DEFAULT 'confirmed',
  total_price DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (guest_id) REFERENCES guests(id)
    ON DELETE RESTRICT,
  FOREIGN KEY (room_id) REFERENCES rooms(id)
    ON DELETE RESTRICT,

  INDEX idx_room_dates (room_id, check_in_date, check_out_date),
  INDEX idx_guest (guest_id),
  INDEX idx_status (status)
);

-- =====================================================
-- 7. HOUSEKEEPING
-- =====================================================
CREATE TABLE housekeeping_tasks (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  room_id BIGINT NOT NULL,
  assigned_to BIGINT NULL,
  priority ENUM('low','normal','urgent') DEFAULT 'normal',
  status ENUM('pending','in_progress','completed') DEFAULT 'pending',
  notes TEXT NULL,
  completed_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (room_id) REFERENCES rooms(id)
    ON DELETE RESTRICT
);

-- =====================================================
-- 8. SETTINGS
-- =====================================================
CREATE TABLE settings (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  `key` VARCHAR(100) UNIQUE,
  value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- 9. ACTIVITY LOGS
-- =====================================================
CREATE TABLE activity_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NULL,
  action VARCHAR(100),
  model_type VARCHAR(100),
  model_id BIGINT NULL,
  description TEXT NULL,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL
);

-- =====================================================
-- 10. ROLE HISTORY (AUDIT)
-- =====================================================
CREATE TABLE user_role_history (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT,
  old_role_id BIGINT NULL,
  new_role_id BIGINT,
  changed_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 11. RATE OVERRIDES
-- =====================================================
CREATE TABLE rate_overrides (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  room_type_id BIGINT NOT NULL,
  date DATE NOT NULL,
  override_rate DECIMAL(10,2),
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (room_type_id) REFERENCES room_types(id)
    ON DELETE CASCADE,

  UNIQUE KEY unique_rate_day (room_type_id, date)
);

-- =====================================================
-- 12. PERMISSIONS DATA
-- =====================================================
INSERT INTO permissions (name, description) VALUES
('manage_users','Manage system users'),
('manage_bookings','Manage bookings'),
('manage_rooms','Manage rooms'),
('manage_guests','Manage guests'),
('manage_housekeeping','Manage housekeeping'),
('manage_payments','Manage payments'),
('view_reports','View reports'),
('manage_settings','Manage system settings');

-- =====================================================
-- 13. ROLES DATA
-- =====================================================
INSERT INTO roles (name, description) VALUES
('admin','Full system access'),
('manager','Hotel manager'),
('front_desk','Reception staff'),
('housekeeping','Cleaning staff'),
('pos_staff','Billing staff');

-- =====================================================
-- 14. ROLE PERMISSIONS MAPPING
-- =====================================================

-- Admin gets everything
INSERT INTO permission_role (permission_id, role_id)
SELECT p.id, r.id FROM permissions p, roles r WHERE r.name='admin';

-- Manager
INSERT INTO permission_role (permission_id, role_id)
SELECT p.id, r.id FROM permissions p, roles r
WHERE r.name='manager'
AND p.name IN ('manage_bookings','manage_rooms','view_reports','manage_settings');

-- Front Desk
INSERT INTO permission_role (permission_id, role_id)
SELECT p.id, r.id FROM permissions p, roles r
WHERE r.name='front_desk'
AND p.name IN ('manage_bookings','manage_guests');

-- Housekeeping
INSERT INTO permission_role (permission_id, role_id)
SELECT p.id, r.id FROM permissions p, roles r
WHERE r.name='housekeeping'
AND p.name='manage_housekeeping';

-- POS Staff
INSERT INTO permission_role (permission_id, role_id)
SELECT p.id, r.id FROM permissions p, roles r
WHERE r.name='pos_staff'
AND p.name='manage_payments';

-- =====================================================
-- 15. USERS (WITH HASH PLACEHOLDERS)
-- =====================================================
INSERT INTO users (name, email, password) VALUES
('System Admin','admin@staysync.com','$2y$10$hashedpassword'),
('Hotel Manager','manager@staysync.com','$2y$10$hashedpassword'),
('Front Desk','frontdesk@staysync.com','$2y$10$hashedpassword'),
('Housekeeping','housekeeping@staysync.com','$2y$10$hashedpassword'),
('POS Staff','pos@staysync.com','$2y$10$hashedpassword');

-- Assign admin role to first user
INSERT INTO role_user VALUES (1,1);

-- =====================================================
-- 16. ROOM TYPES
-- =====================================================
INSERT INTO room_types (name, slug, base_rate, max_occupancy) VALUES
('Standard','standard',50,2),
('Deluxe','deluxe',80,3),
('Suite','suite',120,4);

-- =====================================================
-- 17. ROOMS (REALISTIC HOTEL)
-- =====================================================
INSERT INTO rooms (room_type_id, room_number, floor, status) VALUES
(1,'101',1,'available'),
(1,'102',1,'available'),
(1,'103',1,'maintenance'),
(2,'201',2,'occupied'),
(2,'202',2,'available'),
(2,'203',2,'available'),
(3,'301',3,'available'),
(3,'302',3,'cleaning');

-- =====================================================
-- 18. GUESTS
-- =====================================================
INSERT INTO guests (first_name,last_name,email,phone,country,loyalty_tier,total_stays) VALUES
('John','Doe','john@example.com','0700000001','Kenya','gold',5),
('Mary','Wanjiku','mary@example.com','0700000002','Kenya','silver',3),
('Ahmed','Ali','ahmed@example.com','0700000003','Tanzania','standard',1);

-- =====================================================
-- 19. BOOKINGS
-- =====================================================
INSERT INTO bookings (booking_reference,guest_id,room_id,check_in_date,check_out_date,status,total_price) VALUES
('SS-10001',1,1,'2026-05-10','2026-05-12','checked_out',110),
('SS-10002',2,2,'2026-05-12','2026-05-14','checked_in',150),
('SS-10003',3,3,'2026-05-14','2026-05-16','confirmed',200);

-- =====================================================
-- 20. HOUSEKEEPING
-- =====================================================
INSERT INTO housekeeping_tasks (room_id,assigned_to,priority,status,notes) VALUES
(1,NULL,'normal','completed','Cleaned after checkout'),
(2,NULL,'urgent','in_progress','Guest currently in room'),
(3,NULL,'normal','pending','Prepare room');

-- =====================================================
-- 21. SETTINGS DEFAULTS
-- =====================================================
INSERT INTO settings (`key`, value) VALUES
('hotel_name','StaySync Hotel'),
('tax_rate','0.16'),
('currency','KES');GIY