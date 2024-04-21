import React, { FC, useCallback, useState, FormEventHandler, useEffect, useMemo } from "react";
import { VarhubGameClient, GameState } from "../types";
import { joinTeam } from "../controllers";
import { QrCodeCanvas } from "./QrCodeCanvas";

interface Props {}

export interface RoomConnection {
	client: VarhubGameClient
}

export const Room: FC<RoomConnection> = ({client}) => {

	const [gameState, setGameState] = useState<GameState|null>(null);

	const leave = useCallback(() => {
		history.replaceState({...history.state, join: false}, "");
		void client.close("leave");
	}, []);

	useEffect(() => {

		client.methods.getState().then(setGameState as any)

		client.messages.on("state", setGameState as any)
		return () => client.messages.off("state", setGameState as any);
	}, [client]);

	const inviteUrl = useMemo<string|null>(() => {
		const resultUrl = new URL(location.href);
		resultUrl.searchParams.set("url", client.hub.url);
		resultUrl.searchParams.set("room", client.roomId);
		return resultUrl.href;
	}, [client]);

	const share = useCallback(() => {
		void navigator.share({url: inviteUrl, title: "Join game", text: `Room id: ${client.roomId}`});
	}, [inviteUrl, client])

	return (
		<div>
			{gameState && <RoomGame client={client} gameState={gameState} />}
			<div className="form-line">
				<input type="button" value="LEAVE" onClick={leave}/>
			</div>
			<QrCodeCanvas data={inviteUrl} onClick={share} />
		</div>
	)
}

const RoomGame: FC<{client: VarhubGameClient, gameState: GameState}> = ({client, gameState}) => {
	const [loading, setLoading] = useState(false);
	const canTurn = !gameState.turn || gameState.turn === client.name;

	const move = useCallback(async (index: number) => {
		setLoading(true);
		try {
			await client.methods.move(index);
		} finally {
			setLoading(false);
		}
	}, []);

	return (
		<>
			<div className="flex-sb">
				<div className={"player-name _x "+(gameState.playerX===null ? "_empty": "")}>{gameState.playerX}</div>
				<div>VS</div>
				<div className={"player-name _o "+(gameState.playerO===null ? "_empty": "")}>{gameState.playerO}</div>
			</div>
			<RoomField field={gameState.data} canTurn={!loading && canTurn} height={gameState.height} onMove={move}/>
			{gameState.win !== null && <div>WINNER: {gameState.win}</div>}
			<RoomGameControl gameState={gameState} client={client} />
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

const RoomGameControl: FC<{client: VarhubGameClient, gameState: GameState}> = ({client, gameState}) => {
	const [loading, setLoading] = useState(false);
	const canPlay = gameState.playerO === client.name || gameState.playerX === client.name;

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

	const joinTeam = useCallback(async (team: "x" | "o") => {
		try {
			setLoading(true);
			await client.methods.joinTeam(team);
		} finally {
			setLoading(false);
		}

	}, []);

	return (
		<>
			{(gameState.playerO == null || gameState.playerX == null || canPlay) && (
				<div className="form-line">
					<input type="button" onClick={() => joinTeam("x")} disabled={loading || gameState.playerX != null} value="play X" />
					<input type="button" onClick={() => joinTeam("o")} disabled={loading || gameState.playerO != null} value="play O" />
					<input type="button" onClick={() => joinTeam(null)} disabled={!canPlay} value="spectate" />
				</div>
			)}
			{(gameState.playerO != null && gameState.playerX != null && !gameState.turn && canPlay) && (
				<form onSubmit={onSubmit}>
					<div className="form-line">
						<input name="width" type="number" min={4} max={20} placeholder="width = 11" disabled={loading}/>
						<input name="height" type="number" min={4} max={20} placeholder="height = 7" disabled={loading}/>
						<input value="start" type="submit" disabled={loading}/>
					</div>
				</form>
			)}
		</>
	)
}
