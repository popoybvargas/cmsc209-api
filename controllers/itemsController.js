const _ = require('zv-utils');

const db = require('../db');

const fields = [ 'name', 'category_id', 'description', 'quantity', 'unit_of_measure' ];

exports.createItem = async (req, res) =>
{
	try
	{
		const item = _.pick(req.body, ...fields);
		const itemValues = [];

		for (const field of fields)
		{
			if (item[field]) itemValues.push(item[field]);
			else if (field === 'quantity') itemValues.push(0);
			else itemValues.push('');
		}
		
		itemValues.push(req.user.id);
		
		const { rows } = await db.query('INSERT INTO items (name, category_id, description, quantity, unit_of_measure, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', itemValues);
		
		if (rows.length > 0)
		{
			res.status(201).json(
			{
				status: 'success',
				data: { item: rows[0] }
			});
		}
		else
		{
			res.status(500).json(
			{
				status: 'fail',
				message: 'Unable to insert data'
			});
		}
	}
	catch (err)
	{
		console.log(err);

		res.status(400).json(
		{
			status: 'fail',
			message: err.message
		});
	}
};

exports.getAllItems = async (req, res, next) =>
{
	try
	{
		const query = 'SELECT i.id, i.name, (SELECT name FROM categories WHERE id = i.category_id) category, i.description, i.quantity, i.unit_of_measure, i.created_at, u.username created_by, i.updated_at, (SELECT username FROM users WHERE id = i.updated_by) updated_by FROM items i LEFT JOIN users u ON i.created_by = u.id WHERE i.active = true';
		const { rows: items } = await db.query(query);
		
		res.status(200).json(
		{
			status: 'success',
			results: items.length,
			data: { items }
		});
	}
	catch (err)
	{
		console.log(err);

		res.status(500).json(
		{
			status: 'fail',
			message: err.message
		});
	}
};

exports.getItem = async (req, res, next) =>
{
	try
	{
		const { id } = req.params;

		const query = 'SELECT i.id, i.name, (SELECT name FROM categories WHERE id = i.category_id) category, i.description, i.quantity, i.unit_of_measure, i.created_at, u.username created_by, i.updated_at, (SELECT username FROM users WHERE id = i.updated_by) updated_by FROM items i LEFT JOIN users u ON i.created_by = u.id WHERE i.id = $1 AND i.active = true';
		const { rows } = await db.query(query, [ id ]);
		
		if (rows.length <= 0) return res.status(400).json(
		{
			status: 'fail',
			message: 'Record does not exist'
		});

		res.status(200).json(
		{
			status: 'success',
			data: { item: rows[0] }
		});
	}
	catch (err)
	{
		console.log(err);

		res.status(500).json(
		{
			status: 'fail',
			message: err.message
		});
	}
};

exports.updateItem = async (req, res) =>
{
	try
	{
		const { id } = req.params;
		const { rows } = await db.query('SELECT * FROM items WHERE id = $1', [ id ]);
		const [ item ] = rows;
		
		if (!item) return res.status(400).json(
		{
			status: 'fail',
			message: 'Record does not exist'
		});
		
		const updates = _.pick(req.body, ...fields);
		const updateables = [ 'category_id', 'description', 'unit_of_measure' ];
		const itemUpdates = [];

		for (const field of updateables)
		{
			if (updates[field]) itemUpdates.push(updates[field]);
			else itemUpdates.push(item[field]);
		}
		
		itemUpdates.push(new Date(), req.user.id, id);

		const query = 'UPDATE items SET category_id = $1, description = $2, unit_of_measure = $3, updated_at = $4, updated_by = $5 WHERE id = $6 RETURNING *';
		const response = await db.query(query, itemUpdates);
		
		if (rows.length > 0)
		{
			res.status(200).json(
			{
				status: 'success',
				data: { item: response.rows[0] }
			});
		}
		else
		{
			res.status(500).json(
			{
				status: 'fail',
				message: 'Unable to update record'
			});
		}
	}
	catch (err)
	{
		console.log(err);

		res.status(500).json(
		{
			status: 'fail',
			message: err.message
		});
	}
};

exports.updateQuantity = async (id, quantity, userId) =>
{
	return await db.query('UPDATE items SET quantity = (quantity + $1), updated_at = $2, updated_by = $3 WHERE id = $4', [ quantity, new Date(), userId, id ]);
};

exports.deleteItem = async (req, res) =>
{
	try
	{
		const { id } = req.params;

		const { rowCount } = await db.query('UPDATE items SET active = false, updated_at = $1, updated_by = $2 WHERE id = $3', [ new Date(), req.user.id, id ]);
		
		if (rowCount > 0) res.status(204).json({ status: 'success' });
		else res.status(500).json(
		{
			status: 'fail',
			message: 'Unable to delete record'
		});
	}
	catch (err)
	{
		console.log(err);

		res.status(500).json(
		{
			status: 'fail',
			message: err.message
		});
	}
};