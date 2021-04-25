const _ = require('zv-utils');

const db = require('../db');

const fields = [ 'name', 'address', 'contact_person', 'contact_number', 'payment_mode', 'credit_term' ];

exports.getAllSuppliers = async (req, res, next) =>
{
	try
	{
		const query = 'SELECT s.id, s.name, s.address, s.contact_person, s.contact_number, s.payment_mode, s.credit_term, s.created_at, u.username created_by, s.updated_at, (SELECT username FROM users WHERE id = s.updated_by) updated_by FROM suppliers s LEFT JOIN users u ON s.created_by = u.id WHERE s.active = true';
		const { rows: suppliers } = await db.query(query);
		
		res.status(200).json(
		{
			status: 'success',
			results: suppliers.length,
			data: { suppliers }
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

exports.getSupplier = async (req, res, next) =>
{
	try
	{
		const { id } = req.params;

		const query = 'SELECT s.id, s.name, s.address, s.contact_person, s.contact_number, s.payment_mode, s.credit_term, s.created_at, u.username created_by, s.updated_at, (SELECT username FROM users WHERE id = s.updated_by) updated_by FROM suppliers s LEFT JOIN users u ON s.created_by = u.id WHERE s.id = $1 AND s.active = true';
		const { rows } = await db.query(query, [ id ]);
		
		if (rows.length <= 0) return res.status(400).json(
		{
			status: 'fail',
			message: 'Record does not exist'
		});

		res.status(200).json(
		{
			status: 'success',
			data: { supplier: rows[0] }
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

exports.updateSupplier = async (req, res) =>
{
	try
	{
		const { id } = req.params;
		const { rows } = await db.query('SELECT * FROM suppliers WHERE id = $1', [ id ]);
		const [ supplier ] = rows;
		
		if (!supplier) return res.status(400).json(
		{
			status: 'fail',
			message: '💥 Invalid ID!'
		});
		
		const updates = _.pick(req.body, ...fields);
		
		for (const [ key, val ] of Object.entries(updates))
		{
			supplier[key] = val;
		}
		
		const queryValues = [ ...Object.values(_.pick(supplier, ...fields)) ];

		if (queryValues.length < 6) queryValues.push(0);

		const query = 'UPDATE suppliers SET name = $1, address = $2, contact_person = $3, contact_number = $4, payment_mode = $5, credit_term = $6, updated_at = $7, updated_by = $8 WHERE id = $9 RETURNING *';
		const response = await db.query(query, [ ...queryValues, new Date(), req.user.id, id ]);
		
		if (rows.length > 0)
		{
			res.status(200).json(
			{
				status: 'success',
				data: { supplier: response.rows[0] }
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

exports.deleteSupplier = async (req, res) =>
{
	try
	{
		const { id } = req.params;

		const { rowCount } = await db.query('UPDATE suppliers SET active = false WHERE id = $1', [ id ]);
		
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