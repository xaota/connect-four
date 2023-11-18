import React, { FC, useCallback, useState, ChangeEventHandler, FormEventHandler } from "react";
import Client from "varhub-ws-client";

export const Enter: FC<{onCreateClient: (client: Client) => void}> = (props) => {

	const [action, setAction] = useState("create");
	const [loading, setLoading] = useState(false);

	const onChangeRoomId = useCallback<ChangeEventHandler<HTMLInputElement>>((event) => {
		setAction(event.target.value ? "join" : "create");
	}, []);

	const onSubmit = useCallback<FormEventHandler<HTMLFormElement>>((event) => {
		event.preventDefault();
		const inputs = event.currentTarget.elements;
		const url = (inputs.namedItem("url") as HTMLInputElement).value;
		const room = (inputs.namedItem("room") as HTMLInputElement).value;
		const name = (inputs.namedItem("name") as HTMLInputElement).value;
		console.log({url, room, name});
		(async () => {
			try {
				setLoading(true);
				const client = await createClient(url, room, name);
				props.onCreateClient(client);
			} finally {
				setLoading(false);
			}
		})()

	}, []);

	return (
		<form onSubmit={onSubmit}>
			<div>
				<input disabled={loading} name="url" type="text" placeholder="url" required/>
			</div>
			<div>
				<input disabled={loading} name="room" type="text" placeholder="room (create new if empty)" onChange={onChangeRoomId}/>
			</div>
			<div>
				<input disabled={loading} name="name" type="text" placeholder="name" required/>
			</div>
			<div>
				<input disabled={loading} type="submit" value={action}/>
			</div>
		</form>
	);
}

async function createClient(url, roomId, name){
	const client = new Client(url);
	await client.waitForInit();
	if (!roomId) {
		const gameSource = (await import("tsc:../controllers/game.ts")).default;
		console.log("gameSource", [gameSource]);
		roomId = await client.createRoom({
			modules: {
				"game": {
					type: "js",
					source: gameSource,
					evaluate: true,
					hooks: ["send"]
				}
			}
		});
	}
	await client.joinRoom(roomId, {name});
	return client;
}
