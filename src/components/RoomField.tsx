import React, { FC, useCallback, useEffect, useState } from "react";
import type { VarhubGameClient } from "../types";
import type { GameField, GameTeams } from "../controllers/types";
import RoomRow from "./RoomRow"

interface RoomFieldProps {
	client: VarhubGameClient,
	teams: GameTeams
}
const RoomField: FC<RoomFieldProps> = ({ client, teams}) => {
	const [loading, setLoading] = useState(false);
	const [gameMap, setGameMap] = useState<{ field: GameField, height: number }>({ field: [], height: 0 });

	useEffect(() => {
		client.methods.getField().then(setGameMap);
		client.messages.on("field", setGameMap);
		return () => client.messages.off("field", setGameMap);
	}, []);

	const move = useCallback(async (index: number) => {
		setLoading(true);
		try {
			await client.methods.gameTurn(index);
		} finally {
			setLoading(false);
		}
	}, []);

	return (
		<div className="game-field">
			{gameMap.field.map((row, index) => (
				<RoomRow key={index} index={index} row={row} height={gameMap.height} canTurn={true} onMove={move} />
			))}
		</div>
	)
}

export default RoomField;
