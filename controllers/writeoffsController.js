const _ = require('zv-utils');

const db = require('../db');
const { updateQuantity } = require('./itemsController');

const fields = [ 'item_id', 'quantity', 'unit_of_measure', 'just_cause' ];

exports.createWriteoff = async (req, res) =>
{
	try
	{
		const writeoff = _.pick(req.body, ...fields);

		const response = await db.query('SELECT unit_of_measure FROM items WHERE id = $1', [ writeoff.item_id ]);
		
		if (!response.rows[0]) return res.status(400).json(
		{
			status: 'fail',
			message: 'Item does not exist. Create it first.'
		});

		writeoff.unit_of_measure = response.rows[0].unit_of_measure;

		const writeoffValues = [];

		for (const field of fields)
		{
			if (writeoff[field]) writeoffValues.push(writeoff[field]);
			else writeoffValues.push('');
		}
		
		writeoffValues.push(req.user.id);
		
		const { rows } = await db.query('INSERT INTO writeoffs (item_id, quantity, unit_of_measure, just_cause, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *', writeoffValues);
		
		if (rows.length > 0)
		{
			await updateQuantity(writeoff.item_id, -writeoff.quantity, req.user.id);

			res.status(201).json(
			{
				status: 'success',
				data: { writeoff: rows[0] }
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

exports.getAllWriteoffs = async (req, res, next) =>
{
	try
	{
		const query = 'SELECT w.id, (SELECT name FROM items WHERE id = w.item_id) item, w.quantity, w.unit_of_measure, w.just_cause, w.created_at, u.username created_by, w.updated_at, (SELECT username FROM users WHERE id = w.updated_by) updated_by FROM writeoffs w LEFT JOIN users u ON w.created_by = u.id WHERE w.active = true';
		const { rows: writeoffs } = await db.query(query);
		
		res.status(200).json(
		{
			status: 'success',
			results: writeoffs.length,
			data: { writeoffs }
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

exports.getWriteoff = async (req, res, next) =>
{
	try
	{
		const { id } = req.params;

		const query = 'SELECT w.id, (SELECT name FROM items WHERE id = w.item_id) item, w.quantity, w.unit_of_measure, w.just_cause, w.created_at, u.username created_by, w.updated_at, (SELECT username FROM users WHERE id = w.updated_by) updated_by FROM writeoffs w LEFT JOIN users u ON w.created_by = u.id WHERE w.id = $1 AND w.active = true';
		const { rows } = await db.query(query, [ id ]);
		
		if (rows.length <= 0) return res.status(400).json(
		{
			status: 'fail',
			message: 'Record does not exist'
		});

		res.status(200).json(
		{
			status: 'success',
			data: { writeoff: rows[0] }
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

exports.updateWriteoff = async (req, res) =>
{
	try
	{
		const { id } = req.params;
		const { rows } = await db.query('SELECT * FROM writeoffs WHERE id = $1', [ id ]);
		const [ writeoff ] = rows;
		
		if (!writeoff) return res.status(400).json(
		{
			status: 'fail',
			message: 'Record does not exist'
		});

		let { quantity, just_cause } = req.body;
		
		if (!quantity && !just_cause) return res.status(400).json(
		{
			status: 'fail',
			message: 'No update provided'
		});

		const inventoryAdjustment = quantity ? quantity - writeoff.quantity : null;

		quantity = quantity || writeoff.quantity;
		just_cause = just_cause || writeoff.just_cause;
		
		const query = 'UPDATE writeoffs SET quantity = $1, just_cause = $2, updated_at = $3, updated_by = $4 WHERE id = $5 RETURNING *';
		const response = await db.query(query, [ quantity, just_cause, new Date(), req.user.id, id ]);
		
		if (rows.length > 0)
		{
			if (inventoryAdjustment) await updateQuantity(writeoff.item_id, -inventoryAdjustment, req.user.id);

			res.status(200).json(
			{
				status: 'success',
				data: { writeoff: response.rows[0] }
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

exports.deleteWriteoff = async (req, res) =>
{
	try
	{
		const { id } = req.params;

		const { rowCount } = await db.query('UPDATE writeoffs SET active = false, updated_at = $1, updated_by = $2 WHERE id = $3', [ new Date(), req.user.id, id ]);
		
		if (rowCount > 0)
		{
			const { rows } = await db.query('SELECT quantity FROM writeoffs WHERE id = $1', [ id ]);
			await updateQuantity(id, rows[0].quantity, req.user.id);

			res.status(204).json({ status: 'success' });
		}
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