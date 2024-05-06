import React, { type FC, useCallback, useState, ChangeEventHandler, FormEventHandler, useEffect, useMemo } from "react";
import { Varhub } from "@flinbein/varhub-web-client";
import roomIntegrity from "varhub-modules-integrity:../controllers:index.ts";
import type { VarhubGameClient } from "../types";

export const Enter: FC<{onCreate: (data: VarhubGameClient) => void}> = (props) => {

	const [abortCtrl, setAbortCtrl] = useState<AbortController|null>(null);

	const [initValues] = useState(() => {
		const searchParams = new URLSearchParams(location.search);

		const url = searchParams.get("url") ?? history?.state?.url ?? "https://varhub.dpohvar.ru";
		const room = searchParams.get("room") ?? history?.state?.room ?? "";
		const name = history?.state?.name ?? "";
		const join = history?.state?.join ?? false;
		let autofocusField = "url";
		if (url) autofocusField = "room";
		if (url && room) autofocusField = "name";

		if (searchParams.has("url") || searchParams.has("room")) {
			const currentUrl = new URL(location.href);
			currentUrl.search = "";
			history.replaceState({ url, room, name }, "", currentUrl);
		}
		return { url, room, name, join, autofocusField };
	});

	const [room, setRoom] = useState(initValues.room);
	const [url, setUrl] = useState(initValues.url);
	const [name, setName] = useState(initValues.name);

	const enterRoom = useCallback(async (url: string, room:string, clientName:string) => {
		const ctrl = new AbortController();
		try {
			setAbortCtrl(ctrl);
			const client = await createRoomAndClient(url, room, clientName, ctrl);
			window.history.replaceState({url, room: client.roomId, name: clientName, join: true}, "");
			props.onCreate(client);
		} catch (e) {
			console.error(e);
			alert(e.message);
		} finally {
			setAbortCtrl(null);
		}
	}, []);

	useEffect(() => {
		console.log("INIT-VALUES", initValues);
		if (initValues.url && initValues.room && initValues.name && initValues.join) {
			void enterRoom(initValues.url, initValues.room, initValues.name);
		}
	}, []);

	const onSubmit = useCallback<FormEventHandler<HTMLFormElement>>((event) => {
		event.preventDefault();
		const inputs = event.currentTarget.elements;
		const action = event.nativeEvent?.["submitter"]?.name ?? "join" as string;
		const url = (inputs.namedItem("url") as HTMLInputElement).value;
		const room = action === "join" ? (inputs.namedItem("room") as HTMLInputElement).value : "";
		const name = (inputs.namedItem("name") as HTMLInputElement).value;
		void enterRoom(url, room, name);
	}, []);

	const selectRoom = useCallback((room: string) => {
		setRoom(room);
		if (url && name) void enterRoom(url, room, name);
	}, [url, name])

	const cancel = useCallback(() => {
		if (!abortCtrl) return;
		abortCtrl.abort("cancelled");
		setAbortCtrl(null);
	}, [abortCtrl]);

	return (
		<form onSubmit={onSubmit}>
			<div>
				<input autoFocus={initValues.autofocusField==="url"} disabled={!!abortCtrl} name="url" type="text" placeholder="https://server-address" value={url} onChange={(e) => setUrl(e.target.value)} required/>
			</div>
			<div>
				<input autoFocus={initValues.autofocusField==="room"} disabled={!!abortCtrl} name="room" type="text" placeholder="room (create new if empty)" value={room} onChange={(e) => setRoom(e.target.value)}/>
			</div>
			<div>
				<input autoFocus={initValues.autofocusField==="name"} disabled={!!abortCtrl} name="name" type="text" placeholder="name" value={name} onChange={(e) => setName(e.target.value)} required/>
			</div>
			<div className="form-line">
				<input disabled={!!(abortCtrl || !room)} type="submit" name="join" value="join" />
				<input disabled={!!(abortCtrl)} type="submit" name="create" value="create new" />
				<input onClick={cancel} disabled={!abortCtrl} type="button" value="cancel"/>
			</div>
			{!abortCtrl && <SearchRooms selectRoom={selectRoom} url={url} key={url}/>}
		</form>
	);
}

async function createRoomAndClient(url: string, roomId: string, name: string, ctrl: AbortController){
	const hub = new Varhub(url);
	if (!roomId) {
		const { roomModule, roomIntegrity} = await import("varhub-modules:../controllers:index.ts");
		const roomData = await hub.createRoom(roomModule, {integrity: roomIntegrity});
		roomId = roomData.id;
		console.log("ROOM CREATED", roomData);
	}
	console.log("JOIN ROOM", roomId, name, roomIntegrity);
	return await hub.join(roomId, name, {integrity: roomIntegrity, timeout: ctrl.signal}) as any as VarhubGameClient;
}

const SearchRooms: FC<{selectRoom: (value: string) => void, url: string}> = ({selectRoom, url}) => {
	const [loading, setLoading] = useState(false);
	const [roomMap, setRoomMap] = useState<Record<string, string>>({});

	const search = useCallback(async () => {
		try {
			const varhub = new Varhub(url);
			setLoading(true);
			const rooms = await varhub.findRooms(roomIntegrity);
			setRoomMap(rooms);
		} finally {
			setLoading(false);
		}
	}, []);

	if (!url) return null;

	return (
		<>
			<div className="form-line">
				<input type="button" onClick={search} disabled={loading} value={`Search rooms ${roomIntegrity.substring(0, 8)}`}/>
			</div>
			{Object.keys(roomMap).map(key => (
				<input
					key={key}
					title={roomMap[key]}
					type="button"
					onClick={() => selectRoom(key)} disabled={loading}
					value={key}
				/>
			))}
		</>
	)
}
