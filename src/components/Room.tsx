import React, { FC, useCallback, useState, FormEventHandler, useEffect } from "react";
import Client from "varhub-ws-client";

export const Room: FC<{client: Client}> = ({client}) => {

	const onSubmit = useCallback<FormEventHandler<HTMLFormElement>>((event) => {
		event.preventDefault();
		const input = event.currentTarget.elements.namedItem("msg") as HTMLInputElement;
		void client.methods.send(input.value);
		input.value = "";
	}, [client]);

	const [history, setHistory] = useState<{name, message}[]>([]);

	useEffect(() => {
		function messageHandler(name, msg){
			setHistory(old => ([...old, {name: name, message: msg}]));
		}

		client.methods.getHistory().then(setHistory as any)

		client.messages.on("message", messageHandler);
		return () => {
			client.messages.off("message", messageHandler);
		}
	}, [client])


	return (
		<form onSubmit={onSubmit}>
			<div>client-room-id {client.getRoomId()}</div>
			<div>
				<input name="msg" type="text" placeholder="message..." />
				<input type="submit" value="SEND"/>
				<br/>
				{history.map((line, index) => (
					<div key={index}>
						<strong>{line.name}: </strong>
						<span>{line.message}</span>
					</div>
				))}
			</div>
		</form>
	)
}
