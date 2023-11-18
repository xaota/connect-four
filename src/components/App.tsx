import React, { FC, useState } from "react";
import { Enter } from "./Enter";
import Client from "varhub-ws-client";
import { Room } from "./Room";

export const App: FC = () => {

	const [client, setClient] = useState<Client|null>(null)

	if (!client) return (
		<div>
			<Enter onCreateClient={setClient}/>
		</div>
	);

	return (
		<Room client={client}></Room>
	)
}
