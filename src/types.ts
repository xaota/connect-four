import type { VarhubClient } from "@flinbein/varhub-web-client";
import type { GameField, GameLoopState, GameState, GameTeams, GameFinish } from "./controllers/types";
import type * as RoomMainModule from "./controllers";

export type {GameState};
export type VarhubGameEvents = {
	log: [string],
	state: [GameState],
	teams: [GameTeams],
	field: [{ field: GameField, height: number }],
	turn: [GameLoopState],
	finish: [GameFinish]
}

export type VarhubGameClient = VarhubClient<typeof RoomMainModule, VarhubGameEvents>
