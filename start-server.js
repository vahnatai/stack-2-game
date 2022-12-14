require('dotenv').config();

const GameMatch = require('./GameMatch');
const Player = require('./Player');

const {Client: PGClient} = require('pg');
const process = require('process');
const WebSocket = require('ws');

const pgClient = new PGClient({
	host: process.env.POSTGRES_HOST,
	port: process.env.POSTGRES_PORT,
	user: process.env.POSTGRES_USER,
	password: process.env.POSTGRES_PASSWORD,
	database: process.env.POSTGRES_DATABASE,
});

let waitingPlayer = null;
const matches = [];
const players = [];

async function getPlayer(username, newSocket=null) {
	// first search in active list (sockets already defined)
	let player = players.find(player => player.username === username);
	if (!player) {
		// then check the DB
		const result = await pgClient.query(`SELECT * FROM player WHERE username = '${username}';`);
		if (result.rows.length) {
			const data = result.rows[0];
			player = new Player(data.id, username);
		}
		else {
			// create if not existing
			const createResult = await pgClient.query(`INSERT INTO player (username) VALUES ('${username}') RETURNING id;`);
			const data = createResult.rows[0];
			player = new Player(data.id, username);
		}
		players.push(player);
	}
	if (player && newSocket) { player.socket = newSocket; }
	return player;
}

async function createMatch(player1, player2) {
	const insertResult = await pgClient.query(`
		INSERT INTO game_match (
			player1_id,
			player2_id,
			current_player_id
		)
		VALUES (
			'${player1.id}',
			'${player2.id}',
			'${player1.id}'
		)
		RETURNING id, cells;
	`);
	const {id, cells} = insertResult.rows[0];
	const match = new GameMatch(id, player1, player2, player1, cells);
	matches.push(match);
	return match;
}

async function getMatch(username) {
	const liveMatch = matches.find(match => match.player1.username === username || match.player2.username === username);
	if (liveMatch) {
		return liveMatch;
	}
	const player = await getPlayer(username);
	const result = await pgClient.query(`
		SELECT * FROM game_match WHERE player1_id = ${player.id} OR player2_id = ${player.id};
	`);
	if (!result.rows.length) {
		return null;
	}
	const matchData = result.rows[0];
	const p1Result = await pgClient.query(`
		SELECT * FROM player WHERE id = ${matchData.player1_id};
	`);
	const p2Result = await pgClient.query(`
		SELECT * FROM player WHERE id = ${matchData.player2_id};
	`);
	const player1 = await getPlayer(p1Result.rows[0].username);
	const player2 = await getPlayer(p2Result.rows[0].username);
	const currentPlayer = matchData.current_player_id === player1.id ? player1 : player2;
	return new GameMatch(matchData.id, player1, player2, currentPlayer, matchData.cells);
}

async function saveMatch(match) {
	let cellsData = 'ARRAY [';
	cellsData += match.board.cells.map(row => {
		let rowText = 'ARRAY [';
		rowText += row.map(cell => cell ? `'${cell}'` : 'NULL').join(',');
		rowText += ']';
		return rowText;
	}).join(',');
	cellsData += ']';
	const result = await pgClient.query(`
		UPDATE game_match SET cells = ${cellsData}, current_player_id = ${match.currentTurnPlayer.id} WHERE id = ${match.id};
	`);
}

async function removeMatch(match) {
	const index = matches.indexOf(match);
	if (index >= 0) {
		matches.splice(index, 1);
	}
	const result = await pgClient.query(`SELECT * FROM game_match WHERE id = '${match.id}';`);
	if (!result.rows.length) {
		throw new Error('Match to be removed is not in matches.');
	}
	await pgClient.query(`DELETE FROM game_match WHERE id = '${match.id}';`);
}

async function startServer() {
	await pgClient.connect();
	console.log('Postgres client connected');
	const webSocketServer = new WebSocket.Server({port: process.env.WEBSOCKET_PORT});
	console.log(`New stack-2 websocket server listening at ws://localhost:${process.env.WEBSOCKET_PORT}`);

	const handlers = {
		'join': async (socket, {username}) => {
			const player = await getPlayer(username, socket);
			const matchInProgress = await getMatch(username);
			if (matchInProgress) {
				console.log(`Player '${username}' reconnected!`);
				console.log('player.sendStatus', player.sendStatus);
				player.sendStatus(matchInProgress);
				return;
			}
			if (!waitingPlayer) {
				console.log(`Player '${username}' is waiting for a partner...`);
				waitingPlayer = player;
			}
			else {
				if (username === waitingPlayer.username) {
					const errorMessage = `Your opponent is already called ${username}.`;
					console.error(errorMessage);
					player.sendError(errorMessage);
					return;
				}

				console.log(`Player '${player.username}' has joined player '${waitingPlayer.username}' for a game!`);
				const match = await createMatch(waitingPlayer, player);
				match.onGameOver = async (winner) => {
					winner = winner ? winner.username : null;
					match.player1.sendGameOver(match, winner);
					match.player2.sendGameOver(match, winner);
					await removeMatch(match);
					socket.close();
				};
				player.sendStatus(match);
				waitingPlayer.sendStatus(match);
				waitingPlayer = null;
			}
		},
		'place-left': async (socket, {username, rowIndex}) => {
			const player = await getPlayer(username);
			const match = await getMatch(username);
			if (!match) {
				const errorMessage = `Player '${username}' is not yet in an active game.`;
				console.error(errorMessage);
				player.sendError(errorMessage);
				return;
			}
			try {
				match.placeLeft(username, rowIndex);
			}
			catch (err) {
				console.error(err);
				player.sendError(err.message);
				return;
			}
			saveMatch(match);
			match.player1.sendStatus(match);
			match.player2.sendStatus(match);
		},
		'place-right': async (socket, {username, rowIndex}) => {
			const player = await getPlayer(username);
			const match = await getMatch(username);
			if (!match) {
				const errorMessage = `Player ${username} is not yet in an active game.`;
				console.error(errorMessage);
				player.sendError(errorMessage);
				return;
			}
			try {
				match.placeRight(username, rowIndex);
			}
			catch (err) {
				console.error(err.message);
				player.sendError(err.message);
				return;
			}
			saveMatch(match);
			match.player1.sendStatus(match);
			match.player2.sendStatus(match);
		},
	};

	webSocketServer.on('connection', socket => {
		console.log('New client connection...');

		socket.on('message', async (raw, isBinary) => {
			const message = JSON.parse(isBinary ? raw : raw.toString());
			const {type, data} = message;
			const handler = handlers[type];
			if (!handler) {
				console.log(`Recieved bad message of invalid type ${type}`);
				return;
			}
			if (handler) {
				await handler(socket, data);
			}
		});

		socket.on('close', () => {
			if (waitingPlayer && waitingPlayer.socket === socket) {
				console.log(`Waiting player '${waitingPlayer.username}' left.`);
				waitingPlayer = null;
			}
		});
	});
}

module.exports = startServer;
