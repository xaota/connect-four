import room from "varhub:room";

room.on("offline", room.kick);
room.on("leave", (player) => {
	let playerLeavedGame = false;
	if (player === state.playerO) {
		playerLeavedGame = true;
		state.playerO = null;
	}
	if (player === state.playerX) {
		playerLeavedGame = true;
		state.playerX = null;
	}
	if (playerLeavedGame) {
		state.data = [];
		state.win = null;
		state.turn = null;
		updateState();
	}
});

export interface State {
	win: string | null;
	playerX: string | null;
	playerO: string | null;
	height: number;
	data: ("x"|"o"|"X"|"O")[][];
	turn: string | null;
}
const state: State = {
	win: null,
	playerX: null,
	playerO: null,
	height: 0,
	data: [],
	turn: null,
}
updateState();

function updateState(){
	room.message = JSON.stringify({
		playerX: state.playerX, playerO: state.playerO, height: state.height, width: state.data.length
	});
	room.broadcast("state", state);
}
export function getState(this: {player: string}){
	return state;
}


function getPlayerTeam(player: string): "x" | "o" {
	if (player === state.playerX) return "x";
	if (player === state.playerO) return "o";
	return null;
}

function checkPlayerTurn(player: string): void {
	if (player !== state.playerX && player !== state.playerO) {
		throw new Error("you are not a player");
	}
	if (state.turn && state.turn !== player) {
		throw new Error("not your turn");
	}
}

function getOppositePlayer(player: string): string | null {
	if (player === state.playerX) return state.playerO;
	if (player === state.playerO) return state.playerX;
	return null;
}

export function joinTeam(this: {player: string}, team: "x"|"o"): boolean {
	if (state.turn !== null) throw new Error("wrong state");
	if (!team) {
		if (state.playerX === this.player) {
			state.playerX = null;
			updateState();
			return true;
		} else if (state.playerO === this.player) {
			state.playerO = null;
			updateState();
			return true;
		}
		return false;
	}
	if (team === "x" && state.playerX === null) {
		state.playerX = this.player;
		if (state.playerO === this.player) state.playerO = null;
		updateState();
		return true;
	}
	if (team === "o" && state.playerO === null) {
		state.playerO = this.player;
		if (state.playerX === this.player) state.playerX = null;
		updateState();
		return true;
	}
	return false;
}

export function start(this: {player: string}, rows: number = state.data.length, height: number = state.height){
	checkPlayerTurn(this.player);
	if (state.turn !== null) throw new Error("wrong state");
	if (state.playerO == null || state.playerX == null) throw new Error("no players");
	if (!Number.isInteger(rows)) throw new Error("rows format");
	if (!Number.isInteger(height)) throw new Error("height format");
	rows = Number(rows);
	if (rows < 4 || rows > 20) throw new Error("rows format");
	if (height < 4 || height > 20) throw new Error("height format");

	state.height = height;
	state.turn = null;
	state.win = null;
	state.data = Array.from({length: rows}).map(() => [])
	updateState();
}

export function move(this: {player: string}, colNumber: number){
	checkPlayerTurn(this.player);
	const oppositePlayer = getOppositePlayer(this.player);
	if (!oppositePlayer) throw new Error("game not ready");
	colNumber = Number(colNumber);

	if (!Number.isInteger(colNumber)) throw new Error("wrong colNumber");
	if (colNumber < 0 || colNumber >= state.data.length) throw new Error("colNumber out of bounds");
	const col = state.data[colNumber];
	if (col.length >= state.height) throw new Error("height out");
	const playerTeam = getPlayerTeam(this.player)
	col.push(playerTeam);
	const hasTurns = state.data.some(({length}) => length < state.height);
	state.turn = hasTurns ? getOppositePlayer(this.player) : null;
	checkWin(colNumber, col.length - 1, playerTeam);
	updateState();
	return true;
}

const directions: [number, number][] = [[0, 1], [1, 1], [1, 0], [1, -1]]
function checkWin(colNumber: number, rowNumber: number, team: "x"|"o"){
	const winPoints = checkWinPoints(state.data, colNumber, rowNumber, team, 4);
	if (!winPoints) return;
	const winType = ({x: "X", o: "O"} as const)[team]
	for (const [row, col] of winPoints) state.data[row][col] = winType;
	state.win = team === "x" ? state.playerX : state.playerO;
	state.turn = null;
}

function checkWinPoints(map: ("x"|"o"|"X"|"O")[][], colNumber: number, rowNumber: number, team: "x"|"o", winLength: number): null | [number, number][]{
	const totalWinPoints: [number, number][] = [];
	for (const dir of directions) {
		const winPoints = [];
		let point = [colNumber, rowNumber];
		while (true) {
			const value = map[point[0]]?.[point[1]];
			if (value !== team) break;
			winPoints.push(point);
			point = [point[0]+dir[0], point[1]+dir[1]]
		}
		point = [colNumber-dir[0], rowNumber-dir[1]];
		while (true) {
			const value = map[point[0]]?.[point[1]];
			if (value !== team) break;
			winPoints.push(point);
			point = [point[0]-dir[0], point[1]-dir[1]]
		}
		if (winPoints.length >= winLength) totalWinPoints.push(...winPoints);
	}
	if (totalWinPoints.length === 0) return null;
	return totalWinPoints;
}
