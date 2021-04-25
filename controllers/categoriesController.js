const _ = require('zv-utils');

const db = require('../db');

const fields = [ 'name' ];

exports.getAllCategories = async (req, res, next) =>
{
	try
	{
		const { rows: categories } = await db.query('SELECT * FROM categories');
		
		res.status(200).json(
		{
			status: 'success',
			results: categories.length,
			data: { categories }
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