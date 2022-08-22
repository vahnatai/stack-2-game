class GameBoard {
	constructor() {
		this.cells = [
			[null, null, null, null, null , null, null],
			[null, null, null, null, null , null, null],
			[null, null, null, null, null , null, null],
			[null, null, null, null, null , null, null],
			[null, null, null, null, null , null, null],
			[null, null, null, null, null , null, null],
			[null, null, null, null, null , null, null],
		];
	}

	clone() {
		const newBoard = new GameBoard();
		newBoard.cells = this.cells.map(row => row.map(elem => elem));
		return newBoard;
	}

	isRowFull(rowIndex) {
		return this.cells[rowIndex].every(x => x);
	}

	isFull() {
		return this.cells.map(row => row.every(x => x)).every(x => x);
	}

	checkScoreFromCell(row, column, targetMarker, direction, countSoFar) {
		if (row < 0 || column < 0 || row >= this.cells.length || column >= this.cells[0].length) {
			return -1;
		}
		if (this.cells[row][column] === targetMarker) {
			countSoFar++;
			if (countSoFar === GameBoard.WIN_COUNT) {
				return countSoFar;
			}

			return this.checkScoreFromCell(row + direction.row, column + direction.column, targetMarker, direction, countSoFar);
		}
		return countSoFar;
	}

	checkWinFromCell(row, column, targetMarker, direction, countSoFar) {
		if (row < 0 || column < 0 || row >= this.cells.length || column >= this.cells[0].length) {
			return false;
		}
		if (this.cells[row][column] === targetMarker) {
			countSoFar++;
			if (countSoFar === GameBoard.WIN_COUNT) {
				return true;
			}

			return this.checkWinFromCell(row + direction.row, column + direction.column, targetMarker, direction, countSoFar);
		}
		return false;
	}

	getScore(targetMarker) {
		let scores = [];
		for (let i = 0; i < this.cells.length; i++) {
			for (let j = 0; j < this.cells[0].length; j++) {
				scores = scores.concat([
					this.checkScoreFromCell(i, j, targetMarker, {row: -1, column: -1}, 0),
					this.checkScoreFromCell(i, j, targetMarker, {row: -1, column: 0}, 0),
					this.checkScoreFromCell(i, j, targetMarker, {row: -1, column: 1}, 0),
					this.checkScoreFromCell(i, j, targetMarker, {row: 0, column: -1}, 0),
					this.checkScoreFromCell(i, j, targetMarker, {row: 0, column: 1}, 0),
					this.checkScoreFromCell(i, j, targetMarker, {row: 1, column: -1}, 0),
					this.checkScoreFromCell(i, j, targetMarker, {row: 1, column: 0}, 0),
					this.checkScoreFromCell(i, j, targetMarker, {row: 1, column: 1}, 0),
				]);
			}
		}
		return Math.max(...scores);
	}

	checkWin(targetMarker) {
		for (let i = 0; i < this.cells.length; i++) {
			for (let j = 0; j < this.cells[0].length; j++) {
				if (
					this.checkWinFromCell(i, j, targetMarker, {row: -1, column: -1}, 0)
					|| this.checkWinFromCell(i, j, targetMarker, {row: -1, column: 0}, 0)
					|| this.checkWinFromCell(i, j, targetMarker, {row: -1, column: 1}, 0)
					|| this.checkWinFromCell(i, j, targetMarker, {row: 0, column: -1}, 0)
					|| this.checkWinFromCell(i, j, targetMarker, {row: 0, column: 1}, 0)
					|| this.checkWinFromCell(i, j, targetMarker, {row: 1, column: -1}, 0)
					|| this.checkWinFromCell(i, j, targetMarker, {row: 1, column: 0}, 0)
					|| this.checkWinFromCell(i, j, targetMarker, {row: 1, column: 1}, 0)
				) {
					return true;
				}
			}
		}
		return false;
	}

	placeLeft(marker, rowIndex) {
		const row = this.cells[rowIndex];
		for (let i = 0; i < row.length; i++) {
			if (row[i] === null) {
				row[i] = marker;
				return;
			}
		}
		throw new Error('no room to place in row');
	}

	placeRight(marker, rowIndex) {
		const row = this.cells[rowIndex];
		for (let i = 0; i < row.length; i++) {
			const translatedIndex = row.length - 1 - i;
			if (row[translatedIndex] === null) {
				row[translatedIndex] = marker;
				return;
			}
		}
		throw new Error('no room to place in row');
	}
}
GameBoard.WIN_COUNT = 4;

module.exports = GameBoard;
