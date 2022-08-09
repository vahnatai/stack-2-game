const GameBoard = require('./GameBoard');

class GameMatch {
	constructor(id, player1, player2, currentPlayer=null, cells=null) {
		this.id = id;
		this.player1 = player1;
		this.player2 = player2;
		this.board = new GameBoard();
		if (cells) {
			this.board.cells = cells;
		}
		this.currentTurnPlayer = currentPlayer || player1;
		this.onGameOver = null;
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
		const winData = this.checkGameOver();
		if (winData) {
			const {winner} = winData;
			this.onGameOver(winner);
		}
		else {
			this.currentTurnPlayer = this.currentTurnPlayer === this.player1 ? this.player2 : this.player1;
		}
	}

	checkGameOver() {
		if (this.board.isFull()) {
			// stalemate
			console.log(`Game with players '${this.player1.username}' and '${this.player2.username}' ended in a stalemate.`);
			return {winner: null};
		}

		if (this.board.checkWin(GameMatch.P1_MARKER)) {
			console.log(`Player 1, '${this.player1.username}', won the game!`);
			return {winner: this.player1};
		}
		else if (this.board.checkWin(GameMatch.P2_MARKER)) {
			console.log(`Player 2, '${this.player2.username}', won the game!`);
			return {winner: this.player2};
		}
		// game not over
		return null;
	}

	placeLeft(username, rowIndex) {
		if (username !== this.currentTurnPlayer.username) {
			console.log('this.currentTurnPlayer.username', this.currentTurnPlayer.username)
			throw Error(`Not your turn, ${username}!`);
		}
		const marker = username === this.player1.username ? GameMatch.P1_MARKER : GameMatch.P2_MARKER;
		this.board.placeLeft(marker, rowIndex);
		this.nextTurn();
	}

	placeRight(username, rowIndex) {
		if (username !== this.currentTurnPlayer.username) {
			throw Error(`Not your turn, ${username}!`);
		}
		const marker = username === this.player1.username ? GameMatch.P1_MARKER : GameMatch.P2_MARKER;
		this.board.placeRight(marker, rowIndex);
		this.nextTurn();
	}
}
GameMatch.P1_MARKER = 'X';
GameMatch.P2_MARKER = 'O';

module.exports = GameMatch;
