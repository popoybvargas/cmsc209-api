const _ = require('zv-utils');

const db = require('../db');
const { updateQuantity } = require('./itemsController');

const fields = [ 'item_id', 'quantity', 'unit_of_measure' ];

exports.createConsumption = async (req, res) =>
{
	try
	{
		const consumption = _.pick(req.body, ...fields);

		const response = await db.query('SELECT unit_of_measure FROM items WHERE id = $1', [ consumption.item_id ]);
		
		if (!response.rows[0]) return res.status(400).json(
		{
			status: 'fail',
			message: 'Item does not exist. Create it first.'
		});

		consumption.unit_of_measure = response.rows[0].unit_of_measure;

		const consumptionValues = [];

		for (const field of fields)
		{
			if (consumption[field]) consumptionValues.push(consumption[field]);
			else consumptionValues.push(0);
		}
		
		consumptionValues.push(req.user.id);
		
		const { rows } = await db.query('INSERT INTO consumptions (item_id, quantity, unit_of_measure, created_by) VALUES ($1, $2, $3, $4) RETURNING *', consumptionValues);
		
		if (rows.length > 0)
		{
			await updateQuantity(consumption.item_id, -consumption.quantity, req.user.id);

			res.status(201).json(
			{
				status: 'success',
				data: { consumption: rows[0] }
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

exports.getAllConsumptions = async (req, res, next) =>
{
	try
	{
		const query = 'SELECT c.id, (SELECT name FROM items WHERE id = c.item_id) item, c.quantity, c.unit_of_measure, c.created_at, u.username created_by, c.updated_at, (SELECT username FROM users WHERE id = c.updated_by) updated_by FROM consumptions c LEFT JOIN users u ON c.created_by = u.id WHERE c.active = true';
		const { rows: consumptions } = await db.query(query);
		
		res.status(200).json(
		{
			status: 'success',
			results: consumptions.length,
			data: { consumptions }
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

exports.getConsumption = async (req, res, next) =>
{
	try
	{
		const { id } = req.params;

		const query = 'SELECT c.id, (SELECT name FROM items WHERE id = c.item_id) item, c.quantity, c.unit_of_measure, c.created_at, u.username created_by, c.updated_at, (SELECT username FROM users WHERE id = c.updated_by) updated_by FROM consumptions c LEFT JOIN users u ON c.created_by = u.id WHERE c.id = $1 AND c.active = true';
		const { rows } = await db.query(query, [ id ]);
		
		if (rows.length <= 0) return res.status(400).json(
		{
			status: 'fail',
			message: 'Record does not exist'
		});

		res.status(200).json(
		{
			status: 'success',
			data: { consumption: rows[0] }
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

exports.updateConsumption = async (req, res) =>
{
	try
	{
		const { id } = req.params;
		const { rows } = await db.query('SELECT * FROM consumptions WHERE id = $1', [ id ]);
		const [ consumption ] = rows;
		
		if (!consumption) return res.status(400).json(
		{
			status: 'fail',
			message: 'Record does not exist'
		});

		const { quantity } = req.body;
		
		if (!quantity) return res.status(400).json(
		{
			status: 'fail',
			message: 'No update provided'
		});

		const inventoryAdjustment = quantity ? quantity - consumption.quantity : null;
		
		const query = 'UPDATE consumptions SET quantity = $1, updated_at = $2, updated_by = $3 WHERE id = $4 RETURNING *';
		const response = await db.query(query, [ quantity, new Date(), req.user.id, id ]);
		
		if (rows.length > 0)
		{
			if (inventoryAdjustment) await updateQuantity(consumption.item_id, -inventoryAdjustment, req.user.id);

			res.status(200).json(
			{
				status: 'success',
				data: { consumption: response.rows[0] }
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

exports.deleteConsumption = async (req, res) =>
{
	try
	{
		const { id } = req.params;

		const { rowCount } = await db.query('UPDATE consumptions SET active = false, updated_at = $1, updated_by = $2 WHERE id = $3', [ new Date(), req.user.id, id ]);
		
		if (rowCount > 0)
		{
			const { rows } = await db.query('SELECT quantity FROM consumptions WHERE id = $1', [ id ]);
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