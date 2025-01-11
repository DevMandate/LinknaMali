-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 10, 2025 at 01:05 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `linknamali`
--

-- --------------------------------------------------------

--
-- Table structure for table `apartments`
--

CREATE TABLE `apartments` (
  `apartment_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `location` varchar(100) NOT NULL,
  `purpose` varchar(100) NOT NULL,
  `size` varchar(100) NOT NULL,
  `price` varchar(100) NOT NULL,
  `floor_number` int(11) NOT NULL,
  `number_of_bedrooms` int(11) NOT NULL,
  `number_of_bathrooms` int(11) NOT NULL,
  `amenities` varchar(200) NOT NULL,
  `image` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `documents` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`documents`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `commercial`
--

CREATE TABLE `commercial` (
  `commercial_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `commercial_size` varchar(100) NOT NULL,
  `price` varchar(1000) NOT NULL,
  `location` varchar(255) NOT NULL,
  `purpose` varchar(100) NOT NULL,
  `size` varchar(100) NOT NULL,
  `commercial_type` enum('office','retail','warehouse','airbnb','lodging','industrial','mixed-use') NOT NULL,
  `amenities` varchar(100) NOT NULL,
  `image` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `documents` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`documents`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `commercial`
--

INSERT INTO `commercial` (`commercial_id`, `user_id`, `title`, `description`, `commercial_size`, `price`, `location`, `purpose`, `size`, `commercial_type`, `amenities`, `image`, `created_at`, `updated_at`, `documents`) VALUES
('1', '1', 'Prime Office Space', 'Spacious and modern office located in the city center.', '250sq', 'KSH 1,000,000', 'Lamu', '', '', 'office', '', '<FileStorage: \'office1.jpg\' (\'image/jpeg\')>', '2024-12-15 14:10:49', '2024-12-15 14:10:49', NULL),
('2', '7', 'Prime Office Space', 'Spacious and modern office located in the city center.', '250sq', 'KSH 1,000,000', 'Lamu', 'buy', '650 by 450 sq', 'office', 'Backup generator, security', '<FileStorage: \'office1.jpg\' (\'image/jpeg\')>', '2024-12-19 17:51:40', '2024-12-19 17:51:40', NULL),
('5f77255d-bb57-46be-90a9-499a4a0ad38d', '3', 'Prime Office Space', 'Spacious and modern office located in the city center.', '250sq', 'KSH 1,000,000', 'Lamu', 'sell', '650 by 450 sq', 'office', 'Backup generator, security', 'office1.jpg', '2025-01-09 17:57:02', '2025-01-09 17:57:02', '[\"More_NOTES1.pdf\"]'),
('76a67ea5-65b2-4ba9-9660-5bb9522bc07e', '3', 'Prime Office Space', 'Spacious and modern office located in the city center.', '250sq', 'KSH 1,000,000', 'Lamu', 'buy', '650 by 450 sq', 'office', 'Backup generator, security', '<FileStorage: \'office1.jpg\' (\'image/jpeg\')>', '2025-01-06 08:27:33', '2025-01-06 08:27:33', NULL),
('ae01cfff-cb08-4d93-9857-91a057faece6', '8', 'Prime Office Space', 'Spacious and modern office located in the city center.', '250sq', 'KSH 1,000,000', 'Lamu', 'buy', '650 by 450 sq', 'office', 'Backup generator, security', '<FileStorage: \'office1.jpg\' (\'image/jpeg\')>', '2025-01-06 08:26:58', '2025-01-06 08:26:58', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `houses`
--

CREATE TABLE `houses` (
  `house_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `number_of_bedrooms` int(10) UNSIGNED NOT NULL,
  `number_of_bathrooms` int(10) UNSIGNED NOT NULL,
  `amenities` varchar(100) NOT NULL,
  `image` varchar(500) DEFAULT NULL,
  `location` varchar(255) NOT NULL,
  `price` varchar(100) NOT NULL,
  `size_in_acres` varchar(100) NOT NULL,
  `purpose` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `documents` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`documents`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `houses`
--

INSERT INTO `houses` (`house_id`, `user_id`, `title`, `description`, `number_of_bedrooms`, `number_of_bathrooms`, `amenities`, `image`, `location`, `price`, `size_in_acres`, `purpose`, `created_at`, `updated_at`, `documents`) VALUES
('1', '1', 'Luxury Villa', 'A beautiful luxury villa with modern amenities and ocean view.	', 5, 4, '', 'luxuryvilla.jpg', 'Mombasa', '', '2', '', '2024-12-14 09:22:59', '2024-12-14 09:22:59', NULL),
('4', '7', 'Latent Villa', 'A beautiful luxury villa with modern amenities and ocean view.	', 5, 4, '', 'luxuryvilla.jpg', 'Mariakani', '2000000', '4', '', '2024-12-16 12:09:04', '2024-12-16 12:09:04', NULL),
('5', '7', 'Latent Villa', 'A beautiful luxury villa with modern amenities and ocean view.	', 5, 4, 'Parking,Garden,Swimming pool', 'luxuryvilla.jpg', 'Watamu', '7000000', '3', 'Buy', '2024-12-19 17:14:55', '2024-12-19 17:14:55', NULL),
('6', '3', 'Latent Villa', 'A beautiful luxury villa with modern amenities and ocean view.	', 5, 4, 'Parking,Garden,Swimming pool', 'luxuryvilla.jpg', 'Watamu', '7000000', '3', 'Buy', '2024-12-19 17:15:06', '2024-12-19 17:15:06', NULL),
('7', '6', 'Latent Villa', 'A beautiful luxury villa with modern amenities and ocean view.	', 5, 4, 'Parking,Garden,Swimming pool', 'luxuryvilla.jpg', 'Watamu', '7000000', '3', 'Buy', '2024-12-19 17:15:19', '2024-12-19 17:15:19', NULL),
('8', '8', 'Latent Villa', 'A beautiful luxury villa with modern amenities and ocean view.	', 5, 4, 'Parking,Garden,Swimming pool', 'luxuryvilla.jpg', 'Watamu', '7000000', '3', 'Buy', '2024-12-19 17:15:27', '2024-12-19 17:15:27', NULL),
('ab218077-aa79-4c30-9c19-7fcced3f75ce', '8', 'Latent Villa', 'A beautiful luxury villa with modern amenities and ocean view.	', 5, 4, 'Parking,Garden,Swimming pool', 'luxuryvilla.jpg', 'Watamu', '7000000', '3', 'Buy', '2025-01-06 07:52:36', '2025-01-06 07:52:36', NULL),
('f7f94584-fc35-4900-86af-68579084376e', '3', 'Latent Villa', 'A beautiful luxury villa with modern amenities and ocean view.	', 5, 4, 'Parking,Garden,Swimming pool', 'luxuryvilla.jpg', 'Watamu', '7000000', '3', 'sell', '2025-01-09 17:27:04', '2025-01-09 17:27:04', '[\"crop_production_tvt.docx\"]');

-- --------------------------------------------------------

--
-- Table structure for table `land`
--

CREATE TABLE `land` (
  `land_id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `land_size` varchar(100) NOT NULL,
  `land_type` enum('residential','commercial','industrial','agricultural') NOT NULL,
  `location` varchar(255) NOT NULL,
  `price` varchar(1000) NOT NULL,
  `purpose` varchar(100) NOT NULL,
  `amenities` varchar(100) NOT NULL,
  `image` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `documents` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`documents`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `land`
--

INSERT INTO `land` (`land_id`, `user_id`, `title`, `description`, `land_size`, `land_type`, `location`, `price`, `purpose`, `amenities`, `image`, `created_at`, `updated_at`, `documents`) VALUES
('00a010d1-6ac3-41ad-b9ac-1a8c12ccd02d', '8', 'Beta Prime Land	', 'This land is ideal for commercial use and is located near the city.	', '70 acres	', 'commercial', 'Mombasa', '9000000', 'Sell', 'Electricity, Water	,School, Market', 'land1.jpg', '2025-01-09 17:49:41', '2025-01-09 17:49:41', NULL),
('0498b200-d141-4913-b1d0-3d73daff3b39', '7', 'Beta Prime Land	', 'This land is ideal for commercial use and is located near the city.	', '70 acres	', 'commercial', 'Mombasa', '9000000', 'Rent', 'Electricity, Water	,School, Market', 'land1.jpg', '2025-01-06 08:09:50', '2025-01-06 08:09:50', NULL),
('1', '1', 'Prime Agricultural Land	', 'This land is ideal for farming and is located near the river.	', '50 acres	', 'agricultural', 'Malindi', '5000000', '', '', 'land1.jpg', '2024-12-14 11:20:13', '2024-12-14 11:20:13', NULL),
('10', '3', 'Beta Prime Land	', 'This land is ideal for commercial use and is located near the city.	', '70 acres	', 'commercial', 'Mombasa', '9000000', 'Rent', 'Electricity, Water	,School, Market', 'land1.jpg', '2024-12-19 17:35:57', '2024-12-19 17:35:57', NULL),
('2', '1', 'Prime Agricultural Land	', 'This land is ideal for farming and is located near the river.	', '50 acres	', 'agricultural', 'Malindi', '5000000', '', '', 'land1.jpg', '2024-12-14 11:21:41', '2024-12-14 11:21:41', NULL),
('4', '2', 'Alto Prime Land	', 'This land is ideal for commercial use and is located near the city.	', '70 acres	', 'commercial', 'Mombasa', '9000000', '', '', 'land1.jpg', '2024-12-15 10:59:51', '2024-12-15 10:59:51', NULL),
('4979d476-f40f-4359-9679-707f0e484d46', '8', 'Beta Prime Land	', 'This land is ideal for commercial use and is located near the city.	', '70 acres	', 'commercial', 'Mombasa', '9000000', 'sell', 'Electricity, Water	,School, Market', 'land1.jpg', '2025-01-09 17:50:34', '2025-01-09 17:50:34', '[\"Paint.doc\"]'),
('5', '3', 'Alto Prime Land	', 'This land is ideal for commercial use and is located near the city.	', '70 acres	', 'commercial', 'Mombasa', '9000000', '', '', 'land1.jpg', '2024-12-15 11:02:20', '2024-12-15 11:02:20', NULL),
('6', '7', 'Also Prime Land	', 'This land is ideal for commercial use and is located near the city.	', '70 acres	', 'commercial', 'Mombasa', '9000000', '', '', 'land1.jpg', '2024-12-15 11:06:31', '2024-12-15 11:06:31', NULL),
('7', '7', 'Beta Prime Land	', 'This land is ideal for commercial use and is located near the city.	', '70 acres	', 'commercial', 'Mombasa', '9000000', '', '', 'land1.jpg', '2024-12-15 11:19:24', '2024-12-15 11:19:24', NULL),
('8', '7', 'Beta Prime Land	', 'This land is ideal for commercial use and is located near the city.	', '70 acres	', 'commercial', 'Mombasa', '9000000', '', '', 'land1.jpg', '2024-12-15 11:29:02', '2024-12-15 11:29:02', NULL),
('9', '7', 'Beta Prime Land	', 'This land is ideal for commercial use and is located near the city.	', '70 acres	', 'commercial', 'Mombasa', '9000000', 'Rent', 'Electricity, Water	,School, Market', 'land1.jpg', '2024-12-19 17:35:47', '2024-12-19 17:35:47', NULL),
('910a3d3a-4315-4042-b0fe-147764cc7a3e', '8', 'Beta Prime Land	', 'This land is ideal for commercial use and is located near the city.	', '70 acres	', 'commercial', 'Mombasa', '9000000', 'Rent', 'Electricity, Water	,School, Market', 'land1.jpg', '2025-01-09 17:48:56', '2025-01-09 17:48:56', NULL),
('be712b89-adaa-4ce0-8ee6-cccfbd3bf5f2', '8', 'Beta Prime Land	', 'This land is ideal for commercial use and is located near the city.	', '70 acres	', 'commercial', 'Mombasa', '9000000', 'Rent', 'Electricity, Water	,School, Market', 'land1.jpg', '2025-01-06 08:12:03', '2025-01-06 08:12:03', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `services`
--

CREATE TABLE `services` (
  `service_id` char(36) NOT NULL,
  `provider_name` varchar(255) NOT NULL,
  `location` varchar(255) NOT NULL,
  `pin_location` varchar(100) DEFAULT NULL,
  `contact` varchar(100) NOT NULL,
  `description` varchar(200) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `photos` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `services`
--

INSERT INTO `services` (`service_id`, `provider_name`, `location`, `pin_location`, `contact`, `description`, `category`, `photos`, `created_at`, `updated_at`) VALUES
('2bfc2eef-a626-4911-8de6-337cdffb18c9', 'Shwari Movers and Cleaners', 'Nairobi', '21.34444, 23.32233', '0721345543', 'Professional moving and cleaning services', 'Movers and Cleaners, Fumigation, Storage services Decluttering, ', '[\"Snapchat-8743393.jpg\"]', '2025-01-08 09:52:27', '2025-01-08 11:01:46'),
('a2e06a8f-7ded-4f66-b072-4d50cd61ce6b', 'EliteMovers', 'Nairobi', '43.54333', '0133274847', 'ProfessionalMoving', 'Moving', '[\"Snapchat-145209470.jpg\"]', '2025-01-08 10:23:33', '2025-01-08 10:23:33');

-- --------------------------------------------------------

--
-- Table structure for table `support_tickets`
--

CREATE TABLE `support_tickets` (
  `ticket_id` char(36) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `subject` enum('Technical Support','Billing Support','Sales Support','Ads','Subscriptions Support') NOT NULL,
  `message` text NOT NULL,
  `status` varchar(100) DEFAULT 'Open',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `support_tickets`
--

INSERT INTO `support_tickets` (`ticket_id`, `name`, `email`, `subject`, `message`, `status`, `created_at`, `updated_at`) VALUES
('342b8c64-ca39-4d96-b6de-62c8711a30d5', 'Sharon', 'sharon@example.com', 'Technical Support', 'I\'m experiencing issues with the login functionality on the website.', 'Resolved', '2025-01-09 08:48:39', '2025-01-09 09:03:43'),
('4d1807d1-0fb5-4f5c-9b43-3a57871bc131', 'Andrew', 'andrew@example.com', 'Technical Support', 'I\'m experiencing issues with the login functionality on the website.', 'Pending', '2025-01-09 09:04:21', '2025-01-09 09:05:44'),
('f6e981e9-7ac7-40c6-b15d-8f873867374d', 'John Doe', 'johndoe@example.com', 'Technical Support', 'I\'m experiencing issues with the login functionality on the website.', 'Resolved', '2025-01-08 17:09:10', '2025-01-09 09:06:59'),
('feebc09c-4669-452b-835b-c6ca1b488227', 'John Doe', 'johndoe@example.com', 'Technical Support', 'I\'m experiencing issues with the login functionality on the website.', 'Open', '2025-01-08 12:53:18', '2025-01-08 12:53:18');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` char(36) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(200) NOT NULL,
  `id_number` varchar(20) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `password` text NOT NULL,
  `role` enum('admin','owner','buyer','agent') NOT NULL DEFAULT 'buyer',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `id_number`, `email`, `phone_number`, `password`, `role`, `created_at`, `updated_at`) VALUES
('3ac694a0-f29b-4adf-b83a-9e1f76e507f6', 'Pius', 'Pius', '4545454556', 'pius@example.com', '234567845', '482c811da5d5b4bc6d497ffa98491e38', '', '2025-01-10 13:26:26', '2025-01-10 13:26:26');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `apartments`
--
ALTER TABLE `apartments`
  ADD PRIMARY KEY (`apartment_id`),
  ADD KEY `fk_user_id` (`user_id`);

--
-- Indexes for table `commercial`
--
ALTER TABLE `commercial`
  ADD PRIMARY KEY (`commercial_id`),
  ADD KEY `fk_commercial_user_id` (`user_id`);

--
-- Indexes for table `houses`
--
ALTER TABLE `houses`
  ADD PRIMARY KEY (`house_id`),
  ADD KEY `fk_houses_user_id` (`user_id`);

--
-- Indexes for table `land`
--
ALTER TABLE `land`
  ADD PRIMARY KEY (`land_id`),
  ADD KEY `fk_land_user_id` (`user_id`);

--
-- Indexes for table `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`service_id`),
  ADD UNIQUE KEY `unique_contact` (`contact`);

--
-- Indexes for table `support_tickets`
--
ALTER TABLE `support_tickets`
  ADD PRIMARY KEY (`ticket_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `phone_number` (`phone_number`),
  ADD UNIQUE KEY `id_number` (`id_number`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `apartments`
--
ALTER TABLE `apartments`
  ADD CONSTRAINT `fk_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
