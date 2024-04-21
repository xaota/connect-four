import type { VarhubClient } from "@flinbein/varhub-web-client";
import type {State as GameState} from "./controllers";
import type * as RoomMainModule from "./controllers";

export type {GameState};
export type VarhubGameEvents = {
	state: [GameState];
}

export type VarhubGameClient = VarhubClient<typeof RoomMainModule, VarhubGameEvents>
