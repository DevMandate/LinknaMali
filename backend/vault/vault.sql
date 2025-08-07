CREATE DATABASE vault_db;
CREATE USER 'vault_user'@'localhost' IDENTIFIED BY 'M4r1me@20244';
GRANT ALL PRIVILEGES ON vault_db.* TO 'vault_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
