import room from "varhub:room";
import { $gameState, $teams, selectTeamHandler, moveHandler, setFieldSizeHandler, $field, $height, $turnTeam } from "./logic.js"
import type { Team } from "./types";
import { sample } from "effector";

room.on("offline", room.kick);
room.on("leave", player => {});

room.message = "tic-tac-toe-gravity-effector";

export function getGameState() {
	return $gameState.getState();
}

sample({
	source: $gameState,
	filter: Boolean,
	fn: gameState => room.broadcast("state", gameState) // по-хорошему это должен быть effect
});

export function getTeams() {
	return $teams.getState();
}

sample({
	source: $teams,
	filter: Boolean,
	fn: teams => room.broadcast("teams", teams) // по-хорошему это должен быть effect
});

export function getField() {
	return {
		field: $field.getState(),
		height: $height.getState()
	}
}

sample({
	clock: [$field, $height],
	source: { field: $field, height: $height },
	fn: ({ field, height }) => room.broadcast("field", { field, height }) // по-хорошему это должен быть effect
});

sample({
  source: $turnTeam,
  filter: Boolean,
  fn: turnTeam => room.broadcast("turn", turnTeam) // по-хорошему это должен быть effect
})

export function gameJoinTeam(this: { player: string }, team: Team): void {
	selectTeamHandler({ player: this.player, team });
}

export function gameStart(this: { player: string }, rows: number, columns: number) {
	setFieldSizeHandler({ player: this.player, width: columns, height: rows });
}

export function gameTurn(this: { player: string }, colNumber: number) {
	moveHandler({ player: this.player, column: colNumber });
}
