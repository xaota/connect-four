import React, { FC, useCallback, useState, FormEventHandler, useEffect } from "react";
import Client from "varhub-ws-client";

export const Room: FC<{client: Client}> = ({client}) => {

	const onSubmit = useCallback<FormEventHandler<HTMLFormElement>>((event) => {
		event.preventDefault();
		const input = event.currentTarget.elements.namedItem("msg") as HTMLInputElement;
		void client.methods.send(input.value);
		input.value = "";
	}, [client]);

	const leave = useCallback(() => {
		window.history.replaceState({...window.history.state, join: false}, "")
		client.close("leave");
	}, [])

	const clear = useCallback(() => {
		void client.methods.clear();
	}, [])

	const destroy = useCallback(() => {
		void client.methods.destroy();
	}, [])

	const [history, setHistory] = useState<{name, message}[]>([]);

	useEffect(() => {
		function messageHandler(name, msg){
			setHistory(old => ([...old, {name: name, message: msg}]));
		}
		function clearHandler(name, msg){
			setHistory(() => ([]));
		}

		client.methods.getHistory().then(setHistory as any)

		client.messages.on("message", messageHandler);
		client.messages.on("clear", clearHandler);
		return () => {
			client.messages.off("message", messageHandler);
			client.messages.off("clear", clearHandler);
		}
	}, [client])


	return (
		<form onSubmit={onSubmit}>
			<div>client-room-id {client.getRoomId()}</div>
			<div>
				<input name="msg" type="text" placeholder="message..." />
				<input type="submit" value="SEND"/>
				<input type="button" value="CLEAR" onClick={clear}/>
				<input type="button" value="LEAVE" onClick={leave}/>
				<input type="button" value="DESTROY" onClick={destroy}/>
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
