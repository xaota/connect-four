import React, { FC, useEffect, useState } from "react";
import { Enter } from "./Enter";
import Client from "varhub-ws-client";
import { Room } from "./Room";

export const App: FC = () => {

	const [client, setClient] = useState<Client|null>(null);

	useEffect(() => {
		if (!client) return;
		function onClose(){
			setClient(null);
		}
		client.events.on("close", onClose);
		return () => client.events.off("close", onClose);
	}, [client]);

	if (!client) return (
		<div>
			<Enter onCreateClient={setClient}/>
		</div>
	);

	return (
		<Room client={client}></Room>
	)
}
