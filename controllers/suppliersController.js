const _ = require('zv-utils');

const db = require('../db');

const fields = [ 'name', 'address', 'contact_person', 'contact_number', 'payment_mode', 'credit_term' ];

exports.createSupplier = async (req, res) =>
{
	try
	{
		const supplier = _.pick(req.body, ...fields);
		const supplierValues = [];

		for (const field of fields)
		{
			if (supplier[field]) supplierValues.push(supplier[field]);
			else if (field === 'payment_mode') supplierValues.push('cash');
			else if (field === 'credit_term') supplierValues.push(0);
			else supplierValues.push('');
		}

		supplierValues.push(req.user.id);

		const { rows } = await db.query('INSERT INTO suppliers (name, address, contact_person, contact_number, payment_mode, credit_term, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', supplierValues);
		
		if (rows.length > 0)
		{
			res.status(201).json(
			{
				status: 'success',
				data: { supplier: rows[0] }
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
			message: 'Record does not exist'
		});
		
		const updates = _.pick(req.body, ...fields);
		const supplierUpdates = [];

		for (const field of fields)
		{
			if (updates[field]) supplierUpdates.push(updates[field]);
			else supplierUpdates.push(supplier[field]);
		}
		
		supplierUpdates.push(new Date(), req.user.id, id);

		const query = 'UPDATE suppliers SET name = $1, address = $2, contact_person = $3, contact_number = $4, payment_mode = $5, credit_term = $6, updated_at = $7, updated_by = $8 WHERE id = $9 RETURNING *';
		const response = await db.query(query, supplierUpdates);
		
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

		const { rowCount } = await db.query('UPDATE suppliers SET active = false, updated_at = $1, updated_by = $2 WHERE id = $3', [ new Date(), req.user.id, id ]);
		
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