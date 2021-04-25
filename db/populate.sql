INSERT INTO categories (name) VALUES
	('Beverage'),
	('Burger'),
	('Coffee'),
	('Fries'),
	('Milk Tea'),
	('Packing'),
	('Rice Meals Ingredients'),
	('Sanitary');

INSERT INTO suppliers (name, address, contact_number, payment_mode, created_by) VALUES
	('S&R', 'E.O. Perez & Ouano Ave., N.R.A., Mandaue City', '(032) 238-9998', 'cash',
		(SELECT id from users WHERE username = 'admin')
	);

INSERT INTO items (name, category_id, unit_of_measure, created_by) VALUES (
	'Coke Regular',
	(SELECT id FROM categories WHERE name='Beverage'),
	'can',
	(SELECT id from users WHERE username = 'admin')
);

INSERT INTO purchases (item_id, quantity, supplier_id, created_by) VALUES (
	(SELECT id FROM items WHERE name = 'Coke Regular'),
	10,
	(SELECT id FROM suppliers WHERE name = 'S&R'),
	(SELECT id FROM users WHERE username = 'admin')
);

INSERT INTO consumptions (item_id, quantity, created_by) VALUES (
	(SELECT id FROM items WHERE name = 'Coke Regular'),
	5,
	(SELECT id FROM users WHERE username = 'admin')
);

INSERT INTO writeoffs (item_id, quantity, just_cause, created_by) VALUES (
	(SELECT id FROM items WHERE name = 'Coke Regular'),
	1,
	'spoilage',
	(SELECT id FROM users WHERE username = 'admin')
);