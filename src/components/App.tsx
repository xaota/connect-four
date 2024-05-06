import React, { type FC, useEffect, useState } from "react";
import { Enter } from "./Enter.jsx";
import { Room } from "./Room.jsx";
import type { VarhubGameClient } from "../types";


export const App: FC = () => {
	const [client, setClient] = useState<VarhubGameClient | null>(null);

	useEffect(() => {
		// clear connection on close;
		if (!client) return;
		const onClose = () => setClient(null);
		client.on("close", onClose);
		client.on("message", console.log); // логгер
		return () => void client.off("close", onClose);
	}, [client]);

	if (!client) return (
		<div>
			<Enter onCreate={setClient} />
		</div>
	);

	return (
		<Room client={client} />
	)
}
