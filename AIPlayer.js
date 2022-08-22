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

			const moves = {};
			for (let i = 0; i < match.board.cells.length; i++) {
				// don't bother with moves on full row 
				if (!match.board.isRowFull(i)) {
					moves[['left', i]] = this.scoreMove(match, i, 'left');
					moves[['right', i]] = this.scoreMove(match, i, 'right');
				}
			}
			
			let maxValue = -1;
			let max = null;
			for (const [moveKey, value] of Object.entries(moves)) {
				let [side, rowIndex] = moveKey.split(',');
				rowIndex = parseInt(rowIndex);
				if (value > maxValue) {
					maxValue = value;
					max = {side, rowIndex};
				}
			}

			if (maxValue === -1) {
				this.moveRandom(match);
			}
			else {
				if (max.side === 'left') {
					match.placeLeft(this.username, max.rowIndex);
				}
				else {
					match.placeRight(this.username, max.rowIndex);
				}
			}
		}, 0);
	}

	moveRandom(match) {
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
	}

	scoreMove(match, rowIndex, side) {
		const marker = match.getMarker(this.username);
		const opponentMarker = match.getOpponentMarker(this.username);
		const tryBoard = match.board.clone();
		if (side === 'left') {
			tryBoard.placeLeft(marker, rowIndex);
		}
		else {
			tryBoard.placeRight(marker, rowIndex);
		}
		return tryBoard.getScore(marker) - tryBoard.getScore(opponentMarker);
	}
}

module.exports = AIPlayer;
