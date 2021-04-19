CREATE TYPE role AS ENUM ('user', 'finance', 'admin');
CREATE TABLE users
(
	id BIGSERIAL NOT NULL PRIMARY KEY,
	username VARCHAR(50) NOT NULL,
	email VARCHAR(50) UNIQUE,
	password VARCHAR(64) NOT NULL,
	role role NOT NULL DEFAULT 'user',
	password_changed_at TIMESTAMP
);