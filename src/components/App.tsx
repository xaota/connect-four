import React, { FC, useEffect, useState } from "react";
import { Enter } from "./Enter.jsx";
import { Room } from "./Room.jsx";
import { VarhubGameClient } from "../types";


export const App: FC = () => {
	const [client, setClient] = useState<VarhubGameClient|null>(null);

	useEffect(() => {
		// clear connection on close;
		if (!client) return;
		const onClose = () => setClient(null);
		client.on("close", onClose);
		return () => void client.off("close", onClose);
	}, [client]);


	if (!client) return (
		<div>
			<Enter onCreate={setClient}/>
		</div>
	);

	return (
		<Room client={client}  />
	)
}
