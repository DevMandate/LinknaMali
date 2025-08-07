
-- Inserting users into the `users` table
INSERT INTO `users` (`user_id`, `first_name`, `last_name`, `id_number`, `email`, `phone_number`, `password`, `role`) VALUES
('1', 'Musa', 'Ibrahim', '1234567890', 'musa.ibrahim@email.com', '0712345678', 'password1', 'owner'),
('2', 'Amina', 'Kariuki', '2345678901', 'amina.kariuki@email.com', '0723456789', 'password2', 'buyer'),
('3', 'Juma', 'Ochieng', '3456789012', 'juma.ochieng@email.com', '0734567890', 'password3', 'buyer'),
('4', 'Nancy', 'Wambui', '4567890123', 'nancy.wambui@email.com', '0745678901', 'password4', 'owner'),
('5', 'Victor', 'Mwachiro', '5678901234', 'victor.mwachiro@email.com', '0756789012', 'password5', 'agent'),
('6', 'Kamau', 'Ngugi', '6789012345', 'kamau.ngugi@email.com', '0767890123', 'password6', 'buyer'),
('7', 'Shiro', 'Kamau', '7890123456', 'shiro.kamau@email.com', '0778901234', 'password7', 'buyer'),
('8', 'Eric', 'Munyua', '8901234567', 'eric.munyua@email.com', '0789012345', 'password8', 'agent'),
('9', 'Grace', 'Mwangi', '9012345678', 'grace.mwangi@email.com', '0790123456', 'password9', 'owner'),
('10', 'Paul', 'Kiptoo', '0123456789', 'paul.kiptoo@email.com', '0801234567', 'password10', 'admin');

-- Inserting data into the `land` table (Only Rent or Sale for purpose)
INSERT INTO `land` (`id`, `user_id`, `title`, `size`, `land_type`, `location`, `price`, `availability_status`, `purpose`, `description`, `amenities`, `image`, `documents`, `created_at`, `updated_at`, `likes`, `deleted`, `is_approved`) VALUES
(UUID(), '1', 'Kilimani Plains', '5 Acres', 'Agricultural', 'Mombasa', '5000000', 'Available', 'Sale', 'Prime agricultural land in Kilimani.', 'Water, Electricity', 'kilimani_plains.jpg', NULL, NOW(), NOW(), FLOOR(30 + (RAND() * 470)), 0, 'approved'),
(UUID(), '2', 'Ngong Hills View', '10 Acres', 'Residential', 'Kwale', '10000000', 'Available', 'Sale', 'Residential land with panoramic view of Ngong Hills.', 'Electricity, Water, Roads', 'ngong_hills_view.jpg', NULL, NOW(), NOW(), FLOOR(30 + (RAND() * 470)), 0, 'approved'),
(UUID(), '3', 'Suna Hills', '3 Acres', 'Mixed Use', 'Lamu', '3000000', 'Available', 'Rent', 'Perfect for both residential and commercial development.', 'Electricity, Roads', 'suna_hills.jpg', NULL, NOW(), NOW(), FLOOR(30 + (RAND() * 470)), 1, 'pending'),
(UUID(), '4', 'Ruiru Greenfields', '8 Acres', 'Commercial', 'Kilifi', '7500000', 'Available', 'Sale', 'Large piece of land suitable for commercial purposes in Ruiru.', 'Electricity, Water', 'ruiru_greenfields.jpg', NULL, NOW(), NOW(), FLOOR(30 + (RAND() * 470)), 0, 'approved'),
(UUID(), '5', 'Shanzu Gardens', '2 Acres', 'Residential', 'Taita Taveta', '2500000', 'Sold', 'Sale', 'Beautiful residential land in Shanzu Gardens.', 'Electricity, Water, Road Access', 'shanzu_gardens.jpg', NULL, NOW(), NOW(), FLOOR(30 + (RAND() * 470)), 1, 'pending'),
(UUID(), '4', 'Tana River Farm', '10 Acres', 'Agricultural', 'Tana River', '2000000', 'Available', 'Sale', 'Ideal for crop farming', 'Water source, Fenced', NULL, NULL, NOW(), NOW(), FLOOR(30 + (RAND() * 470)), 0, 'approved');

-- Inserting data into the `commercial` table (Rent, Sale, or Short Stay for purpose)
INSERT INTO `commercial` 
(`id`, `user_id`, `title`, `price`, `availability_status`, `location`, `purpose`, `size`, `commercial_type`, `description`, `amenities`, `image`, `documents`, `created_at`, `updated_at`, `likes`, `deleted`, `is_approved`) 
VALUES
(UUID(), '2', 'Wetlands Tower', '20000000', 'Available', 'Mombasa', 'Sale', '50,000 sq ft', 'Office Space', 'High-end office spaces available in the heart of Mombasa.', 'Parking, WiFi, Elevators', 'wetlands_tower.jpg', NULL, NOW(), NOW(), FLOOR(30 + (RAND() * 470)), 0, 'approved'),
(UUID(), '3', 'Kilimani Plaza', '15000000', 'Available', 'Lamu', 'Rent', '25,000 sq ft', 'Retail', 'Retail space available in Kilimani Plaza.', 'Parking, WiFi, AC', 'kilimani_plaza.jpg', NULL, NOW(), NOW(), FLOOR(30 + (RAND() * 470)), 0, 'approved'),
(UUID(), '4', 'Taita Business Hub', '50000000', 'Available', 'Kwale', 'Short Stay', '100,000 sq ft', 'Commercial', 'Prime commercial space for short-term lease in Taita Business Hub.', 'Parking, WiFi, AC, Security', 'taita_business_hub.jpg', NULL, NOW(), NOW(), FLOOR(30 + (RAND() * 470)), 1, 'pending'),
(UUID(), '5', 'Shanzu Trade Center', '10000000', 'Available', 'Kilifi', 'Rent', '15,000 sq ft', 'Retail', 'Shanzu Trade Center offers retail spaces for various businesses.', 'Parking, WiFi, AC', 'shanzu_trade_center.jpg', NULL, NOW(), NOW(), FLOOR(30 + (RAND() * 470)), 0, 'approved'),
(UUID(), '6', 'Coastline Plaza', '25000000', 'Available', 'Taita Taveta', 'Sale', '30,000 sq ft', 'Office Space', 'Coastline Plaza features premium office spaces with excellent amenities.', 'Parking, WiFi, Elevators', 'coastline_plaza.jpg', NULL, NOW(), NOW(), FLOOR(30 + (RAND() * 470)), 1, 'pending');

-- Inserting data into the `apartments` table (Rent, Sale, or Short Stay for purpose)
INSERT INTO `apartments` 
(`id`, `user_id`, `title`, `location`, `purpose`, `size`, `price`, `availability_status`, `floor_number`, `number_of_bedrooms`, `number_of_bathrooms`, `description`, `amenities`, `image`, `documents`, `created_at`, `updated_at`, `likes`, `deleted`, `is_approved`) 
VALUES
(UUID(), '7', 'Sunset Apartments', 'Mombasa', 'Rent', '3 Bedroom', '30000', 'Available', '5th Floor', '3', '2', 'Modern 3-bedroom apartment in Mombasa with sea views.', 'WiFi, Gym, Swimming Pool', 'sunset_apartments.jpg', NULL, NOW(), NOW(), FLOOR(30 + (RAND() * 470)), 0, 'approved'),
(UUID(), '8', 'Beachfront Towers', 'Kwale', 'Short Stay', '2 Bedroom', '1500000', 'Available', '10th Floor', '2', '1', 'Cozy beachfront apartment located in Kwale.', 'Swimming Pool, Parking', 'beachfront_towers.jpg', NULL, NOW(), NOW(), FLOOR(30 + (RAND() * 470)), 0, 'approved'),
(UUID(), '9', 'Mombasa Heights', 'Kilifi', 'Sale', '4 Bedroom', '50000', 'Available', '12th Floor', '4', '3', 'Spacious 4-bedroom apartment in Kilifi, perfect for families.', 'Gym, Playground, WiFi', 'mombasa_heights.jpg', NULL, NOW(), NOW(), FLOOR(30 + (RAND() * 470)), 1, 'pending'),
(UUID(), '10', 'Lamu Luxury Apartments', 'Lamu', 'Rent', '3 Bedroom', '4000000', 'Sold', '8th Floor', '3', '2', 'Luxurious apartment in the heart of Lamu, great for investors.', 'WiFi, Gym, Pool', 'lamu_luxury_apartments.jpg', NULL, NOW(), NOW(), FLOOR(30 + (RAND() * 470)), 0, 'approved'),
(UUID(), '1', 'Coastal Breeze', 'Taita Taveta', 'Short Stay', '2 Bedroom', '20000', 'Available', '3rd Floor', '2', '1', 'Stylish 2-bedroom apartment with a great view of the coast.', 'WiFi, Parking', 'coastal_breeze.jpg', NULL, NOW(), NOW(), FLOOR(30 + (RAND() * 470)), 0, 'approved'),
(UUID(), '4', 'Tana River Retreat', 'Tana River', 'Rent', '3 Bedroom', '25000', 'Available', '2nd Floor', '3', '2', 'Peaceful 3-bedroom apartment with river views in Tana River.', 'WiFi, Parking', 'tana_river_retreat.jpg', NULL, NOW(), NOW(), FLOOR(30 + (RAND() * 470)), 0, 'approved'),
(UUID(), '2', 'Kilifi Heights', 'Kilifi', 'Sale', '4 Bedroom', '45000', 'Available', '6th Floor', '4', '3', 'Large 4-bedroom family home with modern amenities in Kilifi.', 'Gym, WiFi, Playground', 'kilifi_heights.jpg', NULL, NOW(), NOW(), FLOOR(30 + (RAND() * 470)), 1, 'pending'),
(UUID(), '5', 'Mombasa Bayview', 'Mombasa', 'Rent', '2 Bedroom', '35000', 'Available', '4th Floor', '2', '1', 'Modern 2-bedroom apartment with sea views in Mombasa.', 'Swimming Pool, Gym', 'mombasa_bayview.jpg', NULL, NOW(), NOW(), FLOOR(30 + (RAND() * 470)), 0, 'approved'),
(UUID(), '6', 'Lamu Seafront Villas', 'Lamu', 'Short Stay', '3 Bedroom', '120000', 'Available', '3rd Floor', '3', '2', 'Luxurious 3-bedroom villas with stunning sea views in Lamu.', 'Swimming Pool, Parking', 'lamu_seafront_villas.jpg', NULL, NOW(), NOW(), FLOOR(30 + (RAND() * 470)), 0, 'approved'),
(UUID(), '3', 'Kwale Paradise', 'Kwale', 'Sale', '5 Bedroom', '60000', 'Sold', '7th Floor', '5', '4', 'Spacious and luxurious 5-bedroom apartment in Kwale, perfect for large families.', 'Gym, WiFi, Playground', 'kwale_paradise.jpg', NULL, NOW(), NOW(), FLOOR(30 + (RAND() * 470)), 1, 'pending');

-- Inserting data into the `houses` table (Only Rent or Sale for purpose)
INSERT INTO `houses` 
(`id`, `user_id`, `house_type`, `number_of_bedrooms`, `number_of_bathrooms`, `image`, `location`, `price`, `availability_status`, `size`, `purpose`, `description`, `amenities`, `created_at`, `updated_at`, `likes`, `deleted`, `is_approved`) 
VALUES
(UUID(), '1', 'Villa', '5', '4', 'house_1.jpg', 'Tana River', '8000000', 'Available', '2', 'Sale', 'Spacious villa with a large garden in Tana River area.', 'Pool, Garden, Parking', NOW(), NOW(), FLOOR(30 + (RAND() * 470)), 0, 'approved'),
(UUID(), '3', 'Cottage', '3', '2', 'house_2.jpg', 'Kilifi', '5000000', 'Sold', '1.5', 'Sale', 'Charming cottage in a quiet area of Kilifi.', 'Garden, Fireplace', NOW(), NOW(), FLOOR(30 + (RAND() * 470)), 1, 'pending'),
(UUID(), '4', 'Bungalow', '4', '3', 'house_3.jpg', 'Mombasa', '6000000', 'Available', '1', 'Rent', 'Lovely bungalow with a pool in Mombasa.', 'Pool, Parking', NOW(), NOW(), FLOOR(30 + (RAND() * 470)), 0, 'approved'),
(UUID(), '5', 'Mansion', '6', '5', 'house_4.jpg', 'Taita Taveta', '15000000', 'Available', '5', 'Sale', 'Luxurious mansion with ample space for a large family.', 'Pool, Gym, Parking', NOW(), NOW(), FLOOR(30 + (RAND() * 470)), 0, 'approved'),
(UUID(), '6', 'Townhouse', '3', '2', 'house_5.jpg', 'Kwale', '4000000', 'Available', '2', 'Sale', 'Modern townhouse in a secure neighborhood in Kwale.', 'Parking, Security', NOW(), NOW(), FLOOR(30 + (RAND() * 470)), 1, 'pending');

