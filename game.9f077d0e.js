(0,globalThis.parcelRequire1811.register)("6sg5t",function(e,n){Object.defineProperty(e.exports,"__esModule",{value:!0,configurable:!0}),Object.defineProperty(e.exports,"default",{get:()=>t,set:void 0,enumerable:!0,configurable:!0});var t='import room from "varhub:room";\nimport * as history from "./history";\nroom.addEventListener("join", function (event) {\n    event.client["name"] = event.message.name;\n});\nexport function getHistory() {\n    return history.getHistory();\n}\nexport function send(message) {\n    history.addToHistory(this.client.name, message);\n    room.broadcast("message", this.client.name, message);\n    return true;\n}\n'});//# sourceMappingURL=game.9f077d0e.js.map

//# sourceMappingURL=game.9f077d0e.js.map
