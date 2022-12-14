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

	isFull() {
		return this.cells.map(row => row.every(x => x)).every(x => x);
	}

	checkWinFromCell(row, column, targetMarker, direction, countSoFar) {
		if (row < 0 || column < 0 || row >= this.cells.length || column >= this.cells[0].length) {
			return false;
		}
		if (this.cells[row][column] === targetMarker) {
			countSoFar++;
			if (countSoFar === 4) {
				return true;
			}

			return this.checkWinFromCell(row + direction.row, column + direction.column, targetMarker, direction, countSoFar);
		}
		return false;
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

module.exports = GameBoard;
