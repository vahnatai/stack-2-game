const NBSP = '\xa0';
const P1_MARKER = 'X';
const P2_MARKER = 'O';
const WEBSOCKET_ADDRESS = 'ws://localhost:5005';

let socket;

function renderPlayers(player1, player2, currentPlayer) {
	const playerPanel = document.getElementById('playerPanel');
	playerPanel.innerHTML = '';

	const player1Panel = document.createElement('div');
	player1Panel.id = 'player1Panel';
	if (currentPlayer === player1) {
		player1Panel.classList.add('current');
	}
	player1Panel.appendChild(document.createTextNode(player1));
	playerPanel.appendChild(player1Panel);

	const player2Panel = document.createElement('div');
	player2Panel.id = 'player2Panel';
	if (player2 && currentPlayer === player2) {
		player2Panel.classList.add('current');
	}

	if (!player2 && !currentPlayer) {
		const playWithAIButton = document.createElement('input');
		playWithAIButton.type = 'button';
		playWithAIButton.id = 'playWithAIButton';
		playWithAIButton.value = 'Play with AI Opponent';
		playWithAIButton.onclick = () => {
			socket.send(JSON.stringify({
				type: 'summon-ai',
				data: {username: player1},
			}));
		};

		player2Panel.appendChild(document.createTextNode('Waiting For Player...'));
		player2Panel.appendChild(playWithAIButton);
	}
	else {
		player2Panel.appendChild(document.createTextNode(player2));
	}
	playerPanel.appendChild(player2Panel);
}

function renderBoard(username, currentPlayer, cells) {
	const isYourTurn = username === currentPlayer;
	const boardGrid = document.getElementById('boardGrid');
	const newBoardGrid = document.createElement('div');
	newBoardGrid.id = 'boardGrid';

	if (!currentPlayer) {
		newBoardGrid.onclick = () => alert('The game is over.');
	}
	else if (!isYourTurn) {
		newBoardGrid.onclick = () => alert('Not your turn!');
	}

	cells.forEach((row, i) => {
		const boardRow = document.createElement('div');
		boardRow.className = 'boardRow';

		let leftAvailableIndex, rightAvailableIndex;
		row.forEach((cellContents, j) => {
			const boardCell = document.createElement('div');
			boardCell.classList = ['boardCell'];
			if (cellContents && leftAvailableIndex !== undefined && rightAvailableIndex === undefined) {
				// right-hand content exists, marker before
				rightAvailableIndex = j - 1;
			}

			if (cellContents === P1_MARKER) {
				boardCell.classList.add('playerOne');
			}
			else if (cellContents === P2_MARKER) {
				boardCell.classList.add('playerTwo');
			}
			else if (leftAvailableIndex === undefined) {
				// first space we hit is left marker
				leftAvailableIndex = j;
			}

			boardCell.appendChild(document.createTextNode(cellContents || NBSP))
			boardRow.appendChild(boardCell);
		});
		if (rightAvailableIndex === undefined) {
			// no right-hand content exists, marker last
			rightAvailableIndex = row.length - 1;
		}

		if (isYourTurn) {
			// place active markers for usable spaces
			const leftCell = boardRow.childNodes.item(leftAvailableIndex);
			leftCell.classList.add('available');
			leftCell.onclick = async () => {
				socket.send(JSON.stringify({
					type: 'place-left',
					data: {
						username,
						rowIndex: i,
					},
				}));
			};
			const rightCell = boardRow.childNodes.item(rightAvailableIndex);
			rightCell.classList.add('available');
			rightCell.onclick = async () => {
				socket.send(JSON.stringify({
					type: 'place-right',
					data: {
						username,
						rowIndex: i,
					},
				}));
			};
		}
		newBoardGrid.appendChild(boardRow);
	});
	boardGrid.parentNode.replaceChild(newBoardGrid, boardGrid)
}

window.onload = async () => {
	const username = prompt("Select a username");
	renderPlayers(username);

	socket = new WebSocket(WEBSOCKET_ADDRESS);
	socket.onopen = () => {
		socket.send(JSON.stringify({
			type: 'join',
			data: {username},
		}));
	};

	socket.onmessage = message => {
		const content = JSON.parse(message.data);
		if (content.type === 'STATUS') {
			const {
				cells,
				currentPlayer,
				player1,
				player2,
			} = content;
			renderPlayers(player1, player2, currentPlayer);
			renderBoard(username, currentPlayer, cells);
		}
		else if (content.type === 'GAME_OVER') {
			const {
				cells,
				player1,
				player2,
				winner,
			} = content;
			renderPlayers(player1, player2, null);
			renderBoard(username, null, cells);
			const endMessage = winner ? `Game over! ${winner} wins!` : 'Game over! Out of spaces, nobody wins!';
			alert(endMessage);
		}
		else if (content.type === 'ERROR') {
			console.error('Error from server:', content.errorMessage);
		}
		else {
			console.error('Unexpected message from server:', content);
		}
	};
};
