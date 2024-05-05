import React, { FC, useCallback, useEffect, useState } from "react";
import { GameState, VarhubGameClient } from "../types";
import RoomField from "./RoomField";
import RoomGameControl from "./RoomGameControl";
import type { GameTeams } from "../controllers/types";

const RoomGame: FC<{ client: VarhubGameClient, gameState: GameState }> = ({ client, gameState }) => {
	// const [loading, setLoading] = useState(false);
	// const canTurn = !gameState.turn || gameState.turn === client.name;

	const [teams, setTeams] = useState<GameTeams>({ x: "", o: "" });

	useEffect(() => {
		client.methods.getTeams().then(setTeams);
		client.messages.on("teams", setTeams);
		return () => client.messages.off("teams", setTeams);
	}, []);

	return (
		<>
			<div className="flex-sb">
				<div className={"player-name _x "+(!teams.x ? "_empty": "")}>{teams.x}</div>
				<div>VS</div>
				<div className={"player-name _o "+(!teams.o ? "_empty": "")}>{teams.o}</div>
			</div>
			{gameState === "lobby" && <RoomGameControl client={client} teams={teams} /> }

			{gameState === "game" && <RoomField client={client} teams={teams} /> }

			{/*{gameState.win !== null && <div>WINNER: {gameState.win}</div>}*/}
		</>
	);
}

export default RoomGame;
