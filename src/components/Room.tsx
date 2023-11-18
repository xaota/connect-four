import React, { FC, useCallback, useState, FormEventHandler, useEffect } from "react";
import Client from "varhub-ws-client";

export const Room: FC<{client: Client}> = ({client}) => {

	const onSubmit = useCallback<FormEventHandler<HTMLFormElement>>((event) => {
		event.preventDefault();
		const input = event.currentTarget.elements.namedItem("msg") as HTMLInputElement;
		void client.methods.send(input.value);
	}, [client]);

	const [messageLines, setMessageLines] = useState<{from, message}[]>([]);

	useEffect(() => {
		function messageHandler(from, message){
			console.log("GOT MESSAGE", from, message);
			setMessageLines(old => ([...old, {from, message}]));
		}
		client.messages.on("message", messageHandler);
		return () => client.messages.off("message", messageHandler);
	}, [client])


	return (
		<form onSubmit={onSubmit}>
			<div>client-room-id {client.getRoomId()}</div>
			<div>
				<input name="msg" type="text" placeholder="message..." />
				<input type="submit" value="SEND"/>
				<br/>
				{messageLines.map(line => (
					<div>
						<strong>{line.from}: </strong>
						<span>{line.message}</span>
					</div>
				))}
			</div>
		</form>
	)
}
