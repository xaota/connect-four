import room from "varhub:room";
import config from "varhub:config";

const history: {name: string, message: string}[] = [{name: config.creator, message:"*room created*"}];

room.addEventListener("join", event => {
	event.client["name"] = event.message.name;
});

export function getHistory(){
	return history
}

export function send(message: string) {
	history.push({name: this.client.name, message: message});
	room.broadcast("message", this.client.name, message);
	return true;
}
