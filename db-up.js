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

	console.log('Creating stack2game tables...');
	try {
		await pgClient.query(`
			CREATE TABLE player (
				id SERIAL PRIMARY KEY,
				username TEXT
			);
		`);
		await pgClient.query(`
			CREATE TABLE game_match (
				id SERIAL PRIMARY KEY,
				player1_id INT REFERENCES player(id),
				player2_id INT REFERENCES player(id),
				current_player_id INT REFERENCES player(id),
				cells TEXT[][] DEFAULT ARRAY [
					ARRAY [NULL, NULL, NULL, NULL, NULL , NULL, NULL],
					ARRAY [NULL, NULL, NULL, NULL, NULL , NULL, NULL],
					ARRAY [NULL, NULL, NULL, NULL, NULL , NULL, NULL],
					ARRAY [NULL, NULL, NULL, NULL, NULL , NULL, NULL],
					ARRAY [NULL, NULL, NULL, NULL, NULL , NULL, NULL],
					ARRAY [NULL, NULL, NULL, NULL, NULL , NULL, NULL],
					ARRAY [NULL, NULL, NULL, NULL, NULL , NULL, NULL]
				]
			);
		`);
	}
	catch (err) {
		console.error('Error creating tables:', err.trace || err.message);
		return pgClient.end();
	}
	console.log('Created stack2game tables.');
	return pgClient.end();
})();
