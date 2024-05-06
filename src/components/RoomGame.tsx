import React, { FC, useCallback, useEffect, useState } from "react";
import { GameState, VarhubGameClient } from "../types";
import RoomField from "./RoomField";
import RoomGameControl from "./RoomGameControl";
import type { GameFinish, GameTeams } from "../controllers/types";

const RoomGame: FC<{ client: VarhubGameClient, gameState: GameState }> = ({ client, gameState }) => {
	// const [loading, setLoading] = useState(false);
	// const canTurn = !gameState.turn || gameState.turn === client.name;

	const [teams, setTeams] = useState<GameTeams>({ x: "", o: "" });
	const [finish, setFinish] = useState<GameFinish>({ x: {}, o: {} } as GameFinish);

	useEffect(() => {
		client.methods.getTeams().then(setTeams);
		client.messages.on("teams", setTeams);
		client.messages.on("finish", setFinish);
		return () => {
			client.messages.off("teams", setTeams);
			client.messages.off("finish", setFinish);
		}
	}, []);

	const clientTeam = teams.x === client.name ? "x" : "o";

	return (
		<>
			<div className="flex-sb">
				<div className={"player-name _x "+(!teams.x ? "_empty": "") + (clientTeam === "x" ? " active": "")}>{teams.x}</div>
				<div>VS</div>
				<div className={"player-name _o "+(!teams.o ? "_empty": "") + (clientTeam === "o" ? " active": "")}>{teams.o}</div>
			</div>
			{gameState === "lobby" && <RoomGameControl client={client} teams={teams} /> }

			{gameState === "finish" && (
				<div className="game-finish">
					{finish[clientTeam].status === "win" && <div className="game-finish__winner">Вы победили!</div>}
					{finish[clientTeam].status === "loose" && <div className="game-finish__looser">Вы проиграли!</div>}
				</div>
			)}
			{(["game", "finish"] as Array<GameState>).includes(gameState) && <RoomField client={client} teams={teams} gameState={gameState} /> }
		</>
	);
}

export default RoomGame;
