import React, { FC, useCallback, useState, ChangeEventHandler, FormEventHandler, useEffect } from "react";
import Client from "varhub-ws-client";
type ModuleHooks = Extract<Parameters<Client["createRoom"]>[0]["modules"]["string"], {type: "js"}>["hooks"]
export const Enter: FC<{onCreateClient: (data: {client: Client, team: "x"|"o"|"s", url: string}) => void}> = (props) => {


	const [loading, setLoading] = useState(false);

	const [initValues] = useState(() => {
		const searchParams = new URLSearchParams(location.search);

		const url = searchParams.get("url") ?? history?.state?.url ?? "";
		const room = searchParams.get("room") ?? history?.state?.room ?? "";
		const name = history?.state?.name ?? "";
		const team = history?.state?.team ?? "";

		if (searchParams.has("url") || searchParams.has("room")) {
			const currentUrl = new URL(location.href);
			currentUrl.search = "";
			history.replaceState({ url, room, name, team }, "", currentUrl);
		}
		return { url, room, name, team };
	});

	const [action, setAction] = useState(() => initValues.room ? "join" : "create");

	const onChangeRoomId = useCallback<ChangeEventHandler<HTMLInputElement>>((event) => {
		setAction(event.target.value ? "join" : "create");
	}, []);

	const enterRoom = useCallback(async (url: string, room:string, name:string, team:"x"|"o"|"s") => {
		if (!team) return;
		console.log("ENTER ROOM", {url, room, name, team})
		try {
			setLoading(true);
			const client = await createClient(url, room, {name,team});
			window.history.replaceState({url, room: client.getRoomId(), name, team}, "");
			props.onCreateClient({client, team, url});
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
				<input disabled={loading} name="url" type="text" placeholder="wss://server-address" defaultValue={initValues.url} required/>
			</div>
			<div>
				<input disabled={loading} name="room" type="text" placeholder="room (create new if empty)" defaultValue={initValues.room} onChange={onChangeRoomId}/>
			</div>
			<div>
				<input disabled={loading} name="name" type="text" placeholder="name" defaultValue={initValues.name} required/>
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
			const roomModules = await createRoomModules(
				import("varhub-source-ts:../controllers/**/*.ts"),
				import("varhub-source-json:../controllers/**/*.json"),
				{
					"/game": {
						evaluate: true,
						hooks: "*"
					}
				}
			)
			console.log("roomModules", roomModules);
			const [newRoomId, hash] = await client.createRoom({
				modules: roomModules,
				config: {creator: name},
			});
			console.log("Room created", newRoomId, hash);
			roomId = newRoomId;
		}
		await client.joinRoom(roomId, null, params);
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
