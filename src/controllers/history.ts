import config from "varhub:config";
import data from "./bunde/bundle";

const history: {name: string, message: string}[] = [{name: config.creator, message: data.greetMessage}];

export function addToHistory(name: string, message: string){
	history.push({name, message});
}

export function clearHistory(name: string){
	history.length = 0;
	history.push({name, message: data.clearMessage})
}

export function getHistory(){
	return history;
}
