import type { VarhubClient } from "@flinbein/varhub-web-client";
import type { GameField, GameState, GameTeams } from "./controllers/types";
import type * as RoomMainModule from "./controllers";

export type {GameState};
export type VarhubGameEvents = {
	state: [GameState],
	teams: [GameTeams],
	field: [{ field: GameField, height: number }]
}

export type VarhubGameClient = VarhubClient<typeof RoomMainModule, VarhubGameEvents>
