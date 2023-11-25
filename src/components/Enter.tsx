import React, { FC, useCallback, useState, ChangeEventHandler, FormEventHandler, useEffect } from "react";
import {default as Client, ModuleDescription} from "varhub-ws-client";
type ModuleHooks = Extract<ModuleDescription, {type: "js"}>["hooks"]
export const Enter: FC<{onCreateClient: (data: {client: Client, team: "x"|"o"|"s", url: string}) => void}> = (props) => {


	const [loading, setLoading] = useState(false);

	const [initValues] = useState(() => {
		const searchParams = new URLSearchParams(location.search);

		const url = searchParams.get("url") ?? history?.state?.url ?? "";
		const room = searchParams.get("room") ?? history?.state?.room ?? "";
		const name = history?.state?.name ?? "";
		const team = history?.state?.team ?? "";
		let autofocusField = "url";
		if (url) autofocusField = "room";
		if (url && room) autofocusField = "name";

		if (searchParams.has("url") || searchParams.has("room")) {
			const currentUrl = new URL(location.href);
			currentUrl.search = "";
			history.replaceState({ url, room, name, team }, "", currentUrl);
		}
		return { url, room, name, team, autofocusField };
	});

	const [action, setAction] = useState(() => initValues.room ? "join" : "create");

	const onChangeRoomId = useCallback<ChangeEventHandler<HTMLInputElement>>((event) => {
		setAction(event.target.value ? "join" : "create");
	}, []);

	const enterRoom = useCallback(async (url: string, room:string, name:string, team:"x"|"o"|"s") => {
		if (!team) return;
		try {
			setLoading(true);
			const client = await createClient(url, room, {name,team});
			window.history.replaceState({url, room: client.roomId, name, team}, "");
			props.onCreateClient({client, team, url});
		} catch (e) {
			console.error(e);
			alert(e.message);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		console.log("INIT-VALUES", initValues);
		if (initValues.url && initValues.room && initValues.name && initValues.team) {
			void enterRoom(initValues.url, initValues.room, initValues.name, initValues.team as any);
		}
	}, []);

	const onSubmit = useCallback<FormEventHandler<HTMLFormElement>>((event) => {
		event.preventDefault();
		const inputs = event.currentTarget.elements;
		const url = (inputs.namedItem("url") as HTMLInputElement).value;
		const room = (inputs.namedItem("room") as HTMLInputElement).value;
		const name = (inputs.namedItem("name") as HTMLInputElement).value;
		const team = event.nativeEvent?.["submitter"]?.name as string;
		console.log("FORM", {url, room, name, team});
		void enterRoom(url, room, name, team as any);
	}, []);


	return (
		<form onSubmit={onSubmit}>
			<div>
				<input autoFocus={initValues.autofocusField==="url"} disabled={loading} name="url" type="text" placeholder="wss://server-address" defaultValue={initValues.url} required/>
			</div>
			<div>
				<input autoFocus={initValues.autofocusField==="room"} disabled={loading} name="room" type="text" placeholder="room (create new if empty)" defaultValue={initValues.room} onChange={onChangeRoomId}/>
			</div>
			<div>
				<input autoFocus={initValues.autofocusField==="name"} disabled={loading} name="name" type="text" placeholder="name" defaultValue={initValues.name} required/>
			</div>
			<div className="form-line">
				<input name="x" disabled={loading} type="submit" value={action + " X"}/>
				<input name="o" disabled={loading} type="submit" value={action + " O"}/>
				<input name="s" disabled={loading} type="submit" value={action + " spectate"}/>
			</div>
		</form>
	);
}

async function createClient(url: string, roomId: string, params: any){
	const client = new Client(url);
	try {
		await client.waitForInit();
		if (!roomId) {
			const roomModules = await import("varhub-modules:../controllers:/game.ts");
			console.log("roomModules", roomModules);
			const [newRoomId, hash] = await client.createRoom({
				modules: roomModules,
				config: {creator: name},
			});
			console.log("Room created", newRoomId, hash);
			roomId = newRoomId;
		}
		const joinSuccess = await client.joinRoom(roomId, null, params);
		if (!joinSuccess) throw new Error("player rejected by room");
		return client;
	} catch (error) {
		client.close("can not join room");
		throw error;
	}

}
