import room from "varhub:room";
import * as history from "./history";


room.addEventListener("join", event => {
	event.client["name"] = event.message.name;
});

export function getHistory(){
	return history.getHistory();
}

export function clear(){
	history.clearHistory(this.client.name);
	room.broadcast("clear");
}

export function send(message: string) {
	history.addToHistory(this.client.name, message);
	room.broadcast("message", this.client.name, message);
	return true;
}

export function destroy() {
	room.close("closed by "+this.client.name);
	return true;
}
