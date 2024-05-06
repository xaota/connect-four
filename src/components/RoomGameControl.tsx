import React, { FC, FormEventHandler, useCallback, useState } from "react";
import type { GameState, VarhubGameClient } from "../types";
import { GameTeams } from "../controllers/types";

const RoomGameControl: FC<{client: VarhubGameClient, teams: GameTeams }> = ({client, teams}) => {
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
			await client.methods.gameStart(width, height);
		} finally {
			setLoading(false);
		}
	}, []);

	const joinTeam = useCallback(async (team: "x" | "o") => {
		try {
			setLoading(true);
			await client.methods.gameJoinTeam(team);
		} finally {
			setLoading(false);
		}

	}, []);

	return (
		<>
			<div className="form-line">
				<input type="button" onClick={() => joinTeam("x")} disabled={Boolean(loading || teams.x)} value="play X" />
				<input type="button" onClick={() => joinTeam("o")} disabled={Boolean(loading || teams.o)} value="play O" />
				{/*<input type="button" onClick={() => joinTeam(null)} disabled={!canPlay} value="spectate" />*/}
			</div>

			<form onSubmit={onSubmit}>
				<div className="form-line">
					<input name="width" type="number" min={4} max={20} placeholder="width = 11" disabled={loading}/>
					<input name="height" type="number" min={4} max={20} placeholder="height = 7" disabled={loading}/>
					<input value="start" type="submit" disabled={loading}/>
				</div>
			</form>
		</>
	)
}

export default RoomGameControl;
