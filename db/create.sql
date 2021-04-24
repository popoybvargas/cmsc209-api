CREATE TABLE categories (
	id BIGSERIAL PRIMARY KEY,
	name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TYPE unit AS ENUM (
	'piece',
	'pack',
	'container',
	'kilogram',
	'pound',
	'liter',
	'can'
);

CREATE TYPE payment AS ENUM (
	'cash',
	'check',
	'credit card'
);

CREATE TABLE suppliers (
	id BIGSERIAL PRIMARY KEY,
	name VARCHAR(100) NOT NULL UNIQUE,
	address TEXT NOT NULL,
	contact_person VARCHAR(50) NOT NULL,
	contact_number VARCHAR(20) NOT NULL,
	payment_mode payment,
	credit_term INT DEFAULT 0,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE items (
	id BIGSERIAL PRIMARY KEY,
	name VARCHAR(100) NOT NULL UNIQUE,
	category_id BIGINT REFERENCES categories(id) ON DELETE CASCADE,
	description TEXT,
	unit_of_measure unit,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE purchases (
	id BIGSERIAL PRIMARY KEY,
	item_id BIGINT REFERENCES items(id) NOT NULL,
	quantity DECIMAL NOT NULL,
	supplier_id BIGINT REFERENCES suppliers(id) NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	created_by BIGINT REFERENCES users(id) NOT NULL
);

CREATE TABLE consumptions (
	id BIGSERIAL PRIMARY KEY,
	item_id BIGINT REFERENCES items(id) ON DELETE CASCADE NOT NULL,
	quantity DECIMAL NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	created_by BIGINT REFERENCES users(id) NOT NULL
);

CREATE TABLE writeoffs (
	id BIGSERIAL PRIMARY KEY,
	item_id BIGINT REFERENCES items(id) ON DELETE CASCADE NOT NULL,
	quantity DECIMAL NOT NULL,
	just_cause VARCHAR(100) NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	created_by BIGINT REFERENCES users(id) NOT NULL
);