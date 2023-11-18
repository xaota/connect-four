(0,globalThis.parcelRequire1811.register)("a6Mfq",function(e,n){Object.defineProperty(e.exports,"__esModule",{value:!0,configurable:!0}),Object.defineProperty(e.exports,"default",{get:()=>o,set:void 0,enumerable:!0,configurable:!0});var o='import room from "varhub:room";\nroom.addEventListener("join", function (a) {\n  console.log("JOIN", a.client, a.message), a.client.name = a.message.name;\n});\nexport function send(a) {\n  return room.broadcast("message", this.client.name, a), !0;\n}'});//# sourceMappingURL=game.008a4f21.js.map

//# sourceMappingURL=game.008a4f21.js.map
