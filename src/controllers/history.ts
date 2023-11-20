import config from "varhub:config";
import data from "./bunde/bundle";

const history: {name: string, message: string}[] = [{name: config.creator, message: data.greetMessage}];

export function addToHistory(name: string, message: string){
	history.push({name, message});
}

export function getHistory(){
	return history;
}
