const { promisify } = require('util');

const _ = require('zv-utils');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const db = require('../db');

const fields = [ 'username', 'email', 'password', 'passwordConfirm' ];

const signToken = payload => jwt.sign(payload, process.env.JWT_SECRET,
{
	expiresIn: process.env.JWT_EXPIRY
});

exports.signup = async (req, res) =>
{
	try
	{
		const user = _.pick(req.body, ...fields);
		
		if (user.password !== user.passwordConfirm)
		{
			return res.status(400).json(
			{
				status: 'fail',
				message: 'Passwords did not match'
			});
		}

		user.password = await bcrypt.hash(user.password, 12);
		delete user.passwordConfirm;

		const { rows } = await db.query('INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email, role', Object.values(user));
		
		if (rows.length > 0)
		{
			const { id, email } = rows[0];
			const token = signToken({ id, email });

			res.status(201).json(
			{
				status: 'success',
				token,
				data: { user: rows[0] }
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

exports.login = async (req, res, next) =>
{
	try
	{
		const { email, password } = req.body;

		if (!email || !password) return res.status(400).json({ status: 'fail', message: 'Email and password cannot be empty' });
		
		const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [ email ]);
		
		if (!rows[0] || !await bcrypt.compare(password, rows[0].password)) return res.status(401).json({ status: 'fail', message: 'Invalid email or password' });
		
		const token = signToken({ id: rows[0].id, email });

		delete rows[0]['password'];

		res.status(200).json(
		{
			status: 'success',
			token,
			data: { user: rows[0] }
		});
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

exports.protect = async (req, res, next) =>
{
	try
	{
		let token;
		const { authorization } = req.headers;
		
		if (authorization && authorization.startsWith('Bearer')) token = authorization.split(' ')[1];

		if (!token) return res.status(401).json(
		{
			status: 'fail',
			message: 'You are not logged in. Please log in to get access'
		});

		const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
		
		const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [ decoded.email ]);

		if (!rows[0]) return res.status(401).json(
		{
			status: 'fail',
			message: 'User owning the token no longer exists'
		});
		
		const passwordChangedAt = parseInt(rows[0].password_changed_at?.getTime() / 1000, 10);
		
		if (decoded.iat < passwordChangedAt) return res.status(401).json(
		{
			status: 'fail',
			message: 'Invalid token. Please log in again'
		});
		
		// GRANT ACCESS TO PROTECTED ROUTE
		req.user = _.pick(rows[0], 'id', 'username', 'email', 'role');
		
		next();
	}
	catch (err)
	{
		console.log(err);

		res.status(401).json(
		{
			status: 'fail',
			message: err.message
		});
	}
};

exports.restrictTo = (...roles) => async (req, res, next) =>
{
	if (!roles.includes(req.user.role)) return res.status(403).json(
	{
		status: 'fail',
		message: 'Not allowed to perform this action'
	});

	next();
};