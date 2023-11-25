import React, { FC, useCallback, useState, FormEventHandler, useEffect } from "react";
import Client from "varhub-ws-client";
import { QrCodeCanvas } from "./QrCodeCanvas";


interface GameState {
	win: "x"|"o"|null,
	playerX: string|null,
	playerO: string|null,
	height: number,
	data: ("x"|"o"|"X"|"O")[][],
	turn: "restart"|"x"|"o"|null,
}
export const Room: FC<{client: Client, team: "x"|"o"|"s"}> = ({client, team}) => {

	const [gameState, setGameState] = useState<GameState|null>(null);
	const [logoData, setLogoData] = useState<Uint8Array|null>(null);

	const destroy = useCallback(() => {
		void client.methods.destroy();
	}, [])

	const leave = useCallback(() => {
		history.replaceState({...history.state, team: ""}, "");
		void client.close("leave");
	}, [])

	useEffect(() => {

		client.methods.getState().then(setGameState as any)
		client.methods.getLogo().then(setLogoData as any)

		client.messages.on("state", setGameState as any)
		return () => client.messages.off("state", setGameState as any);
	}, [client])


	return (
		<div>

			{gameState && <RoomGame client={client} gameState={gameState} team={team} />}
			<div className="form-line">
				<input type="button" value="DESTROY" onClick={destroy}/>
				<input type="button" value="LEAVE" onClick={leave}/>
				{logoData && String(logoData)}
			</div>
		</div>
	)
}

const RoomGame: FC<{client: Client, gameState: GameState, team: "x"|"o"|"s"}> = ({client, gameState, team}) => {
	const [loading, setLoading] = useState(false);
	const canTurn = !gameState.turn || gameState.turn === team;

	const move = useCallback(async (index: number) => {
		setLoading(true);
		try {
			await client.methods.move(index);
		} finally {
			setLoading(false)
		}
	}, []);

	const winner = gameState.win === "x" ? gameState.playerX : gameState.win === "o" ? gameState.playerO : null;

	return (
		<>
			<div className="flex-sb">
				<div className={"player-name _x "+(gameState.playerX===null ? "_empty": "")}>{gameState.playerX}</div>
				<div>VS</div>
				<div className={"player-name _o "+(gameState.playerO===null ? "_empty": "")}>{gameState.playerO}</div>
			</div>
			<RoomField field={gameState.data} canTurn={!loading && canTurn} height={gameState.height} onMove={move}/>
			{winner !== null && <div>WINNER: {winner}</div>}
			{gameState.turn === "restart" && team !== "s" && gameState.playerX !== null && gameState.playerO !== null && <RoomGameRestart client={client}/>}
		</>
	);
}

interface RoomFieldProps {
	field: ("x"|"o"|"X"|"O")[][],
	canTurn: boolean,
	height: number
	onMove: (index: number) => void
}
const RoomField: FC<RoomFieldProps> = ({field, canTurn, height, onMove}) => {
	return (
		<div className="game-field">
			{field.map((row, index) => (
				<RoomRow key={index} index={index} row={row} onMove={onMove} canTurn={canTurn} height={height}/>
			))}
		</div>
	)
}

interface RoomRowProps {
	row: ("x"|"o"|"X"|"O")[],
	index: number,
	canTurn: boolean,
	height: number
	onMove: (index: number) => void
}
const RoomRow: FC<RoomRowProps> = ({row, index, canTurn, height, onMove}) => {
	const canTurnHere = row.length < height && canTurn;
	const onClick = useCallback(() => {
		if (!canTurnHere) return;
		onMove(index);
	}, [canTurnHere]);

	return (
		<div className={"game-row _"+(canTurnHere?"active":"not-active")} onClick={onClick}>
			{row.map((item, index) => (
				<div key={index} className={"game-item _"+item}>
					{item}
				</div>
			))}
			{Array.from({length: height-row.length}).map((_, index) => (
				<div key={index} className="game-item _empty">
					#
				</div>
			))}
		</div>
	)
}

const RoomGameRestart: FC<{client: Client}> = ({client}) => {
	const [loading, setLoading] = useState(false);

	const onSubmit = useCallback<FormEventHandler<HTMLFormElement>>(async (event) => {
		event.preventDefault();
		try {
			setLoading(true);
			const inputs = event.currentTarget.elements;
			const widthStr = (inputs.namedItem("width") as HTMLInputElement).value || "11";
			const heightStr = (inputs.namedItem("height") as HTMLInputElement).value || "7";
			const width = Number(widthStr);
			const height = Number(heightStr);
			await client.methods.start(width, height);
		} finally {
			setLoading(false);
		}
	}, []);

	return (
		<form onSubmit={onSubmit}>
			<div className="form-line">
				<input name="width" type="number" min={4} max={20} placeholder="width = 11" disabled={loading} />
				<input name="height" type="number" min={4} max={20} placeholder="height = 7" disabled={loading} />
				<input value="start" type="submit" disabled={loading} />
			</div>

		</form>
	)
}
