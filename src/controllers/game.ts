import room, { type Client } from "varhub:room";

room.addEventListener("join", event => {
	const {name, team} = event.message;
	event.client["name"] = String(name);
	event.client["team"] = String(team);
	if (team === "x") {
		if (state.playerO === name) return event.preventDefault();
		if (state.playerX && state.playerX !== name) return event.preventDefault();
		state.playerX = String(name);
		sendUpdateState();
	} else if (team === "o") {
		if (state.playerX === name) return event.preventDefault();
		if (state.playerO && state.playerO !== name) return event.preventDefault();
		state.playerO = String(name);
		sendUpdateState();
	}
	console.log("JOINED", name, team);
});

const state = {
	win: null as "x"|"o"|null,
	playerX: null as string|null,
	playerO: null as string|null,
	height: 0,
	data: [] as ("x"|"o"|"X"|"O")[][],
	turn: "restart" as "restart"|"x"|"o"|null,
}


function sendUpdateState(){
	room.broadcast("state", state);
}
export function getState(){
	return state;
}


function checkPlayerTeam(client: Client): "x" | "o" {
	if (client["name"] === state.playerX) return "x";
	if (client["name"] === state.playerO) return "o";
	throw new Error("you are not a player");
}

function oppositeTeam(team: "x"|"o"): "x"|"o" {
	return ({x: "o", o: "x"} as const)[team]
}

export function start(rows: number, height: number){
	checkPlayerTeam(this.client);
	if (state.turn !== "restart") throw new Error("wrong state");
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
	sendUpdateState();
}

export function move(colNumber: number){
	const team = checkPlayerTeam(this.client);
	if (state.turn && state.turn !== team) throw new Error("wrong turn state");
	colNumber = Number(colNumber);

	if (!Number.isInteger(colNumber)) throw new Error("wrong colNumber");
	if (colNumber < 0 || colNumber >= state.data.length) throw new Error("colNumber out of bounds");
	const col = state.data[colNumber];
	if (col.length >= state.height) throw new Error("height out");
	col.push(team);
	state.turn = oppositeTeam(team);
	checkWin(colNumber, col.length - 1, team);
	room.broadcast("state", state);
	return true;
}

const directions: [number, number][] = [[0, 1], [1, 1], [1, 0]]
function checkWin(colNumber: number, rowNumber: number, team: "x"|"o"){
	const winPoints = checkWinPoints(state.data, colNumber, rowNumber, team, 4);
	if (!winPoints) return;
	const winType = ({x: "X", o: "O"} as const)[team]
	for (const [row, col] of winPoints) state.data[row][col] = winType;
	state.win = team;
	state.turn = "restart";
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

export function destroy() {
	checkPlayerTeam(this.client);
	room.close("closed by "+this.client.name);
	return true;
}
