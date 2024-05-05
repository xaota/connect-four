import React, { FC, useCallback, useState, FormEventHandler, useEffect, useMemo } from "react";
import { VarhubGameClient, GameState } from "../types";
import { gameJoinTeam } from "../controllers";
import { QrCodeCanvas } from "./QrCodeCanvas";
import RoomGame from "./RoomGame";

interface Props {}

export interface RoomConnection {
	client: VarhubGameClient
}

export const Room: FC<RoomConnection> = ({client}) => {

	const [gameState, setGameState] = useState<GameState>("" as GameState);

	const leave = useCallback(() => {
		history.replaceState({...history.state, join: false}, "");
		void client.close("leave");
	}, []);

	useEffect(() => {
		client.methods.getGameState().then(setGameState)
		client.messages.on("state", setGameState)

		return () => client.messages.off("state", setGameState);
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
