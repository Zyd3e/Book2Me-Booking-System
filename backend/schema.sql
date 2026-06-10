-- Book2Me Hotel Management System - Database Schema
-- MySQL/MariaDB

-- Create Database
CREATE DATABASE IF NOT EXISTS `book2me_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `book2me_db`;

-- Users Table
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(120) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(20),
  `role` ENUM('customer', 'admin', 'hr_manager', 'staff') DEFAULT 'customer',
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_email` (`email`),
  INDEX `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rooms Table
CREATE TABLE `rooms` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `room_number` VARCHAR(50) NOT NULL UNIQUE,
  `room_type` VARCHAR(100) NOT NULL,
  `capacity` INT NOT NULL,
  `price_per_night` FLOAT NOT NULL,
  `description` TEXT,
  `amenities` JSON,
  `floor` INT NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_room_number` (`room_number`),
  INDEX `idx_room_type` (`room_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Halls Table
CREATE TABLE `halls` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `hall_name` VARCHAR(100) NOT NULL UNIQUE,
  `hall_type` VARCHAR(100) NOT NULL,
  `capacity` INT NOT NULL,
  `price_per_hour` FLOAT NOT NULL,
  `description` TEXT,
  `amenities` JSON,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_hall_name` (`hall_name`),
  INDEX `idx_hall_type` (`hall_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Room Bookings Table
CREATE TABLE `room_bookings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `room_id` INT NOT NULL,
  `check_in_date` DATE NOT NULL,
  `check_out_date` DATE NOT NULL,
  `number_of_guests` INT NOT NULL,
  `total_price` FLOAT NOT NULL,
  `status` ENUM('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled') DEFAULT 'pending',
  `special_requests` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_room_id` (`room_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Hall Bookings Table
CREATE TABLE `hall_bookings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `hall_id` INT NOT NULL,
  `event_date` DATE NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `event_type` VARCHAR(100) NOT NULL,
  `expected_guests` INT NOT NULL,
  `total_price` FLOAT NOT NULL,
  `status` ENUM('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled') DEFAULT 'pending',
  `special_requirements` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`hall_id`) REFERENCES `halls`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_hall_id` (`hall_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Staff Profiles Table
CREATE TABLE `staff_profiles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `employee_id` VARCHAR(50) NOT NULL UNIQUE,
  `department` VARCHAR(100) NOT NULL,
  `position` VARCHAR(100) NOT NULL,
  `salary` FLOAT,
  `hire_date` DATE NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_employee_id` (`employee_id`),
  INDEX `idx_department` (`department`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Shifts Table
CREATE TABLE `shifts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `staff_id` INT NOT NULL,
  `shift_date` DATE NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `shift_type` VARCHAR(50) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`staff_id`) REFERENCES `staff_profiles`(`id`) ON DELETE CASCADE,
  INDEX `idx_staff_id` (`staff_id`),
  INDEX `idx_shift_date` (`shift_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Attendance Table
CREATE TABLE `attendance` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `staff_id` INT NOT NULL,
  `attendance_date` DATE NOT NULL,
  `check_in_time` TIME,
  `check_out_time` TIME,
  `status` VARCHAR(50) NOT NULL,
  `remarks` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`staff_id`) REFERENCES `staff_profiles`(`id`) ON DELETE CASCADE,
  INDEX `idx_staff_id` (`staff_id`),
  INDEX `idx_attendance_date` (`attendance_date`),
  UNIQUE KEY `unique_attendance` (`staff_id`, `attendance_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample Data (Optional)
-- Insert admin user (password: admin123)
INSERT INTO `users` (`email`, `password_hash`, `first_name`, `last_name`, `role`, `is_active`) 
VALUES ('admin@book2me.com', '$2b$12$iB.Vf9I4PrL9kQ7eZqZ9C.NjJl3JQJ0JR9qJ9q9zJ9Z9Z9Z9Z', 'Admin', 'User', 'admin', TRUE);

-- Insert sample rooms
INSERT INTO `rooms` (`room_number`, `room_type`, `capacity`, `price_per_night`, `description`, `amenities`, `floor`, `is_active`) VALUES
('101', 'Single', 1, 100, 'Comfortable single room with garden view', '["WiFi", "AC", "TV", "Minibar"]', 1, TRUE),
('102', 'Double', 2, 150, 'Spacious double room with city view', '["WiFi", "AC", "TV", "Minibar", "Bathrobe"]', 1, TRUE),
('201', 'Suite', 4, 250, 'Luxurious suite with living area', '["WiFi", "AC", "TV", "Minibar", "Bathrobe", "Hot tub"]', 2, TRUE);

-- Insert sample halls
INSERT INTO `halls` (`hall_name`, `hall_type`, `capacity`, `price_per_hour`, `description`, `amenities`, `is_active`) VALUES
('Grand Ballroom', 'Wedding', 500, 500, 'Large ballroom for weddings and galas', '["Projector", "Sound System", "Catering", "Dance Floor"]', TRUE),
('Conference Room A', 'Conference', 50, 100, 'Professional conference room', '["Projector", "Sound System", "WiFi", "Whiteboards"]', TRUE);
