const GameBoard = require('./GameBoard');

class GameMatch {
	constructor(id, player1, player2, currentPlayer=null, cells=null, pgClient) {
		this.id = id;
		this.player1 = player1;
		this.player2 = player2;
		this.board = new GameBoard();
		if (cells) {
			this.board.cells = cells;
		}
		this.pgClient = pgClient;

		this.currentTurnPlayer = currentPlayer || player1;
		this.onGameOver = null;
		this.isComplete = false;
	}

	getPlayer(username) {
		if (username === this.player1.username) {
			return this.player1;
		}
		else if (username === this.player2.username) {
			return this.player2;
		}
		return null;
	}

	nextTurn() {
		this.player1.sendStatus(this);
		this.player2.sendStatus(this);
		this.currentTurnPlayer = this.currentTurnPlayer === this.player1 ? this.player2 : this.player1;
		this.checkGameOver();
		if (this.isComplete) {
			this.currentTurnPlayer = null;
		}
	}

	checkGameOver() {
		if (this.board.isFull()) {
			// stalemate
			console.log(`Game with players '${this.player1.username}' and '${this.player2.username}' ended in a stalemate.`);
			this.onGameOver(null);
			this.isComplete = true;
			return;
		}

		if (this.board.checkWin(GameMatch.P1_MARKER)) {
			console.log(`Player 1, '${this.player1.username}', won the game!`);
			this.onGameOver(this.player1);
			this.isComplete = true;
			return;
		}
		else if (this.board.checkWin(GameMatch.P2_MARKER)) {
			console.log(`Player 2, '${this.player2.username}', won the game!`);
			this.onGameOver(this.player2);
			this.isComplete = true;
			return;
		}
	}

	placeLeft(username, rowIndex) {
		if (username !== this.currentTurnPlayer.username) {
			console.log('this.currentTurnPlayer.username', this.currentTurnPlayer.username)
			throw Error(`Not your turn, ${username}!`);
		}
		const marker = username === this.player1.username ? GameMatch.P1_MARKER : GameMatch.P2_MARKER;
		this.board.placeLeft(marker, rowIndex);
		this.nextTurn();

		this.saveMatch();
		this.player1.sendStatus(this);
		this.player2.sendStatus(this);

	}

	placeRight(username, rowIndex) {
		if (username !== this.currentTurnPlayer.username) {
			throw Error(`Not your turn, ${username}!`);
		}
		const marker = username === this.player1.username ? GameMatch.P1_MARKER : GameMatch.P2_MARKER;
		this.board.placeRight(marker, rowIndex);
		this.nextTurn();

		this.saveMatch();
		this.player1.sendStatus(this);
		this.player2.sendStatus(this);
	}

	async saveMatch() {
		let cellsData = 'ARRAY [';
		cellsData += this.board.cells.map(row => {
			let rowText = 'ARRAY [';
			rowText += row.map(cell => cell ? `'${cell}'` : 'NULL').join(',');
			rowText += ']';
			return rowText;
		}).join(',');
		cellsData += ']';
		const result = await this.pgClient.query(`
			UPDATE game_match SET
				cells = ${cellsData},
				current_player_id = ${this.currentTurnPlayer ? this.currentTurnPlayer.id : 'NULL'}
			WHERE id = ${this.id};
		`);
	}
}
GameMatch.P1_MARKER = 'X';
GameMatch.P2_MARKER = 'O';

module.exports = GameMatch;
