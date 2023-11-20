import React, { FC, useCallback, useState, ChangeEventHandler, FormEventHandler, useEffect } from "react";
import Client from "varhub-ws-client";
type ModuleHooks = Extract<Parameters<Client["createRoom"]>[0]["modules"]["string"], {type: "js"}>["hooks"]
export const Enter: FC<{onCreateClient: (client: Client) => void}> = (props) => {

	const [action, setAction] = useState(() => history?.state?.room ? "join" : "create");
	const [loading, setLoading] = useState(false);

	const onChangeRoomId = useCallback<ChangeEventHandler<HTMLInputElement>>((event) => {
		setAction(event.target.value ? "join" : "create");
	}, []);

	const enterRoom = useCallback(async (url, room, name) => {
		console.log("ENTER ROOM", {url, room, name})
		try {
			setLoading(true);
			const client = await createClient(url, room, name);
			window.history.replaceState({url, room: client.getRoomId(), name, join: true}, "");
			props.onCreateClient(client);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		const state = window.history.state;
		if (state?.url && state?.room && state?.name && state?.join) {
			void enterRoom(state.url, state.room, state.name)
		}
	}, []);

	const onSubmit = useCallback<FormEventHandler<HTMLFormElement>>((event) => {
		event.preventDefault();
		const inputs = event.currentTarget.elements;
		const url = (inputs.namedItem("url") as HTMLInputElement).value;
		const room = (inputs.namedItem("room") as HTMLInputElement).value;
		const name = (inputs.namedItem("name") as HTMLInputElement).value;
		console.log({url, room, name});
		void enterRoom(url, room, name);
	}, []);


	return (
		<form onSubmit={onSubmit}>
			<div>
				<input disabled={loading} name="url" type="text" placeholder="wss://server-address" defaultValue={window.history?.state?.url} required/>
			</div>
			<div>
				<input disabled={loading} name="room" type="text" placeholder="room (create new if empty)" defaultValue={window.history?.state?.room} onChange={onChangeRoomId}/>
			</div>
			<div>
				<input disabled={loading} name="name" type="text" placeholder="name" defaultValue={window.history?.state?.name} required/>
			</div>
			<div>
				<input disabled={loading} type="submit" value={action}/>
			</div>
		</form>
	);
}

async function createClient(url: string, roomId: string, name: string){
	const client = new Client(url);
	try {
		await client.waitForInit();
		if (!roomId) {
			const roomModules = await createRoomModules(
				import("varhub-source-ts:../controllers/**/*.ts"),
				import("varhub-source-json:../controllers/**/*.json"),
				{"/game": {
						evaluate: true,
						hooks: "*"
					}}
			)
			console.log("roomModules", roomModules);
			const [newRoomId, hash] = await client.createRoom({
				modules: roomModules,
				config: {creator: name}
			});
			console.log("Room created", newRoomId, hash);
			roomId = newRoomId;
		}
		await client.joinRoom(roomId, "d983f6d1eb53aa29699a6883bde7ef4b62b8145770c361193466e3617c631c18",{name});
		return client;
	} catch (error) {
		client.close("can not join room");
		throw error;
	}

}

async function createRoomModules(
	jsModules: any,
	jsonModules: any,
	options?: Record<string, {evaluate?: boolean, hooks?: ModuleHooks}>
){
	const result = {};
	const tasks: Promise<any>[] = []
	createJsModule(jsModules, "/");
	createJsonModule(jsonModules, "/");
	function createJsModule(modulesMap, path: string){
		for (const key of Object.keys(modulesMap)) {
			const module = modulesMap[key];
			const modulePath = path+key;
			if (typeof module === "object") {
				return createJsModule(module, modulePath + "/");
			}
			tasks.push((async () => {
				const source = (await module()).default;
				const moduleConfig = options?.[modulePath];
				const desc: any = {
					type: "js",
					source
				}
				if (moduleConfig?.evaluate) desc.evaluate = true;
				if (moduleConfig?.hooks) desc.hooks = moduleConfig.hooks;
				result[modulePath+".js"] = desc
			})());
		}
	}
	function createJsonModule(modulesMap, path: string){
		for (const key of Object.keys(modulesMap)) {
			const modulePath = path+key;
			const module = modulesMap[key];
			if (typeof module === "object") {
				return createJsonModule(module, modulePath + "/");
			}
			tasks.push((async () => {
				result[modulePath+".json"] = {
					type: "json",
					source: JSON.stringify(await module())
				}
			})());
		}
	}
	await Promise.all(tasks);
	return result;
}
