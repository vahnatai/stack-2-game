class Player {
	constructor(id, username, socket) {
		this.id = id;
		this.username = username;
		this.socket = socket;
	}

	send(data) {
		if (!this.socket) {
			console.info(`No socket for user ${this.username}`);
			return;
		}
		this.socket.send(JSON.stringify(data));
	}

	sendStatus(match) {
		this.send({
			type: 'STATUS',
			cells: match.board.cells,
			currentPlayer: match.currentTurnPlayer.username,
			player1: match.player1.username,
			player2: match.player2.username,
		});
	}

	sendGameOver(match, winner) {
		this.send({
			type: 'GAME_OVER',
			cells: match.board.cells,
			player1: match.player1.username,
			player2: match.player2.username,
			winner,
		});
	}

	sendError(errorMessage) {
		this.send({
			type: 'ERROR',
			errorMessage,
		});
	}
}

module.exports = Player;
