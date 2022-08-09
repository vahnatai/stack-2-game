const Player = require('./Player');

class AIPlayer extends Player {
	constructor(id, username) {
		super(id, username, null);
	}

	sendStatus(match) {
		setTimeout(() => {
			if (match.isComplete || match.currentTurnPlayer !== this){
				// no need to take a turn
				return;
			}
			let index = Math.floor(Math.random() * match.board.cells.length);
			while (match.board.isRowFull(index)) {
				index = Math.floor(Math.random() * match.board.cells.length);
			}
			if (Math.random() > .5) {
				match.placeLeft(this.username, index);
			}
			else {
				match.placeRight(this.username, index);
			}
		}, 0);
	}
}

module.exports = AIPlayer;
