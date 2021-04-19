const _ = require('zv-utils');

const db = require('../db');

const fields = [ 'username', 'email' ];

exports.getAllUsers = async (req, res, next) =>
{
	try
	{
		const { rows: users } = await db.query('SELECT id, username, email, role FROM users');
		
		res.status(200).json(
		{
			status: 'success',
			results: users.length,
			data: { users }
		});
	}
	catch (err) { console.log(err); }
};

exports.getUser = async (req, res, next) =>
{
	try
	{
		const { id } = req.params;

		const { rows } = await db.query('SELECT id, username, email, role FROM users WHERE id = $1', [ id ]);
		
		if (rows.length <= 0) return res.status(400).json(
		{
			status: 'fail',
			message: '💥 Invalid ID!'
		});

		res.status(200).json(
		{
			status: 'success',
			data: { user: rows[0] }
		});
	}
	catch (err) { console.log(err); }
};

exports.updateUser = async (req, res) =>
{
	try
	{
		const { id } = req.params;
		const updates = _.pick(req.body, ...fields);

		const { rows } = await db.query('UPDATE users SET username = $1, email = $2 WHERE id = $3 RETURNING id, username, email', [ ...Object.values(updates), id ]);
		
		if (rows.length > 0)
		{
			res.status(200).json(
			{
				status: 'success',
				data: { user: rows[0] }
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
	catch (err) { console.log(err); }
};

exports.deleteUser = async (req, res) =>
{
	try
	{
		const { id } = req.params;

		const { rowCount } = await db.query('DELETE FROM users WHERE id = $1', [ id ]);
		
		if (rowCount > 0) res.status(204).json({ status: 'success' });
		else res.status(500).json(
		{
			status: 'fail',
			message: 'Unable to delete record'
		});
	}
	catch (err) { console.log(err); }
};