const _ = require('zv-utils');

const db = require('../db');
const { updateQuantity } = require('./itemsController');

const fields = [ 'item_id', 'quantity', 'unit_of_measure', 'cost', 'supplier_id' ];

exports.createPurchase = async (req, res) =>
{
	try
	{
		const purchase = _.pick(req.body, ...fields);

		const response = await db.query('SELECT unit_of_measure FROM items WHERE id = $1', [ purchase.item_id ]);
		
		if (!response.rows[0]) return res.status(400).json(
		{
			status: 'fail',
			message: 'Item does not exist. Create it first.'
		});

		purchase.unit_of_measure = response.rows[0].unit_of_measure;

		const purchaseValues = [];

		for (const field of fields)
		{
			if (purchase[field]) purchaseValues.push(purchase[field]);
			else purchaseValues.push(0);
		}
		
		purchaseValues.push(req.user.id);
		
		const { rows } = await db.query('INSERT INTO purchases (item_id, quantity, unit_of_measure, cost, supplier_id, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', purchaseValues);
		
		if (rows.length > 0)
		{
			await updateQuantity(purchase.item_id, purchase.quantity, req.user.id);

			res.status(201).json(
			{
				status: 'success',
				data: { purchase: rows[0] }
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

exports.getAllPurchases = async (req, res, next) =>
{
	try
	{
		const query = 'SELECT p.id, (SELECT name FROM items WHERE id = p.item_id) item, p.quantity, p.unit_of_measure, p.cost, (SELECT name FROM suppliers WHERE id = p.supplier_id) supplier, p.created_at, u.username created_by, p.updated_at, (SELECT username FROM users WHERE id = p.updated_by) updated_by FROM purchases p LEFT JOIN users u ON p.created_by = u.id WHERE p.active = true';
		const { rows: purchases } = await db.query(query);
		
		res.status(200).json(
		{
			status: 'success',
			results: purchases.length,
			data: { purchases }
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

exports.getPurchase = async (req, res, next) =>
{
	try
	{
		const { id } = req.params;

		const query = 'SELECT p.id, (SELECT name FROM items WHERE id = p.item_id) item, p.quantity, p.unit_of_measure, p.cost, (SELECT name FROM suppliers WHERE id = p.supplier_id) supplier, p.created_at, u.username created_by, p.updated_at, (SELECT username FROM users WHERE id = p.updated_by) updated_by FROM purchases p LEFT JOIN users u ON p.created_by = u.id WHERE p.id = $1 AND p.active = true';
		const { rows } = await db.query(query, [ id ]);
		
		if (rows.length <= 0) return res.status(400).json(
		{
			status: 'fail',
			message: 'Record does not exist'
		});

		res.status(200).json(
		{
			status: 'success',
			data: { purchase: rows[0] }
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

exports.updatePurchase = async (req, res) =>
{
	try
	{
		const { id } = req.params;
		const { rows } = await db.query('SELECT * FROM purchases WHERE id = $1', [ id ]);
		const [ purchase ] = rows;
		
		if (!purchase) return res.status(400).json(
		{
			status: 'fail',
			message: 'Record does not exist'
		});
		
		const updates = _.pick(req.body, ...fields);
		const updateables = [ 'quantity', 'cost', 'supplier_id' ];
		const purchaseUpdates = [];

		for (const field of updateables)
		{
			if (updates[field]) purchaseUpdates.push(updates[field]);
			else purchaseUpdates.push(purchase[field]);
		}
		
		purchaseUpdates.push(new Date(), req.user.id, id);

		const { quantity } = updates;
		const inventoryAdjustment = quantity ? quantity - purchase.quantity : null;
		
		const query = 'UPDATE purchases SET quantity = $1, cost = $2, supplier_id = $3, updated_at = $4, updated_by = $5 WHERE id = $6 RETURNING *';
		const response = await db.query(query, purchaseUpdates);
		
		if (rows.length > 0)
		{
			if (inventoryAdjustment) await updateQuantity(purchase.item_id, inventoryAdjustment, req.user.id);

			res.status(200).json(
			{
				status: 'success',
				data: { purchase: response.rows[0] }
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

exports.deletePurchase = async (req, res) =>
{
	try
	{
		const { id } = req.params;

		const { rowCount } = await db.query('UPDATE purchases SET active = false, updated_at = $1, updated_by = $2 WHERE id = $3', [ new Date(), req.user.id, id ]);
		
		if (rowCount > 0)
		{
			const { rows } = await db.query('SELECT quantity FROM purchases WHERE id = $1', [ id ]);
			await updateQuantity(id, -rows[0].quantity, req.user.id);

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