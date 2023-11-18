import room from "varhub:room";

room.addEventListener("join", event => {
	console.log("JOIN", event.client, event.message);
	event.client["name"] = event.message.name;
})
export function send(msg: string) {
	room.broadcast("message", this.client.name, msg);
	return true;
}
