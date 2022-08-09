require('dotenv').config();
const process = require('process');

const {Client: PGClient} = require('pg');

(async () => {
	const pgClient = new PGClient({
		host: process.env.POSTGRES_HOST,
		port: process.env.POSTGRES_PORT,
		user: process.env.POSTGRES_USER,
		password: process.env.POSTGRES_PASSWORD,
		database: process.env.POSTGRES_DATABASE,
	});

	try {
		await pgClient.connect();
	}
	catch (err) {
		console.error('Error connecting to PostgreSQL server:', err.trace || err.message);
		return;
	}
	console.log('Connected to PostgreSQL DB...')

	console.log('Dropping stack2game tables...');
	try {
		await pgClient.query('DROP TABLE game_match;');
		await pgClient.query('DROP TABLE player;');
	}
	catch (err) {
		console.error('Error dropping tables:', err.trace || err.message);
		return pgClient.end();
	}
	console.log('Dropped stack2game tables.');
	return pgClient.end();
})();