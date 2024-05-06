import React, { FC, useCallback, useEffect, useState } from "react";
import type { VarhubGameClient } from "../types";
import type { GameField, GameLoopState, GameState, GameTeams } from "../controllers/types";
import RoomRow from "./RoomRow"

interface RoomFieldProps {
	client: VarhubGameClient,
	teams: GameTeams,
	gameState: GameState
}
const RoomField: FC<RoomFieldProps> = ({ client, teams, gameState }) => {
	const [loading, setLoading] = useState(false);
	const [gameMap, setGameMap] = useState<{ field: GameField, height: number }>({ field: [], height: 0 });
	const [turn, setTurn] = useState<GameLoopState>("" as GameLoopState);

	useEffect(() => {
		client.methods.getField().then(setGameMap);
		client.messages.on("field", setGameMap);
		client.messages.on("turn", setTurn);
		return () => {
			client.messages.off("field", setGameMap);
			client.messages.off("turn", setTurn);
		}
	}, []);

	const move = useCallback(async (index: number) => {
		setLoading(true);
		try {
			await client.methods.gameTurn(index);
		} finally {
			setLoading(false);
		}
	}, []);

	const canTurn = gameState === "game" && !loading && teams[turn] === client.name;

	return (
		<div>
			{gameState === "game" && <p>ход команды {turn} {canTurn && "(ваш ход)"}</p>}
			<div className="game-field">
				{gameMap.field.map((row, index) => (
					<RoomRow key={index} index={index} row={row} height={gameMap.height} canTurn={canTurn} onMove={move} />
				))}
			</div>
		</div>
	)
}

export default RoomField;
