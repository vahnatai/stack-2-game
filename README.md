# stack-2-game

Starts a websocket backend in Node.js and a HTML/CSS/vanilla JavaScript frontend for hosting matches of a two-player board game that is essentially connect-four, but the pieces stack on either side of the board instead of bottom-up.

The server has a waiting room of size one. The waiting player is paired with the next player to connect.

If a game match is in progress, loading the page again using the same username will reconnect you to the same match.

The players take turns placing their markers. On their turn, a player may choose a row and place their token in either the leftmost or rightmost space available.The game ends when one player has a diagonal, vertical or horizontal line of 4 of their tokens. If the board is filled without any player making a line, the game ends in stalemate.

Many matches can operate at the same time. When a match is over, players are free to pair with different opponents for new matches.

## Running the Project

You will need a .env file to not have to set environment variables manually. To use default values for everything, `cp .dist.env .env`.

You will need a local PostgreSQL server with a user and database you have access to. For a simple setup that matches the example environment variable credentials, try a default installation and run the following as the postgres user:

```
CREATE USER stack2game WITH PASSWORD 'password';
CREATE DATABASE stack2game;
GRANT ALL PRIVILEGES ON DATABASE stack2game TO stack2game;
```

If you need to use different credentials or ports, edit the .env file.

Install needed dependencies with `npm i`.

The database schema can be prepared with `node db-up` (or refreshed with `node db-down && node db-up`).

The game server and client can be hosted with with `npm start`. This will host the game client at `http://localhost:CLIENT_HTTP_PORT`, where `CLIENT_HTTP_PORT` is an environment variable (default `80`).
