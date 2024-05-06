import { createStore, createEvent, sample } from "effector";
import {
	GameField,
	GameFieldSizeSelect,
	GameState,
	GameTurn,
	GameTeams,
	TeamSelect,
	Team,
	FieldPatch,
	Sequence, GameTurnResult,
	GameLoopState,
	GameFinish
} from "./types";
import { getPlayerTeam, isPlayer, checkWinPoints, getOppositeTeam } from "./selectors.js";
import room from "varhub:room";

export const $gameState = createStore<GameState>("lobby", { name: "gameState" });

// выбор команды
export const $teams = createStore<GameTeams>({ x: "", o: "" }, { name: "gameTeams" });

export const selectTeamHandler = createEvent<TeamSelect>();
const joinTeam = createEvent<TeamSelect>("joinTeam");
const leaveTeam = createEvent<TeamSelect>("leaveTeam");

sample({
	clock: selectTeamHandler,
	source: $gameState,
	filter: (state, { team }) => state === "lobby" && team !== null,
	fn: (_, data) => data,
	target: joinTeam
});

sample({
	clock: selectTeamHandler,
	source: $gameState,
	filter: (state, { team }) => state === "lobby" && team === null,
	fn: (_, data) => data,
	target: leaveTeam
});

sample({
	clock: joinTeam,
	source: $teams,
	filter: (teams, { team }) => !teams[team],
	fn: (teams, { player, team }): GameTeams => {
		const oppositeTeam = getOppositeTeam(team);
		return teams[oppositeTeam] === player
			? { ...teams, [team]: player, [oppositeTeam]: "" }
			: { ...teams, [team]: player, [oppositeTeam]: teams[oppositeTeam] };
	},
	target: $teams
})

sample({
	clock: leaveTeam,
	source: $teams,
	filter: (teams, { player }) => teams.x === player || teams.o === player,
	fn: (teams, { player }) => teams.o === player ? { x: teams.x, o: "" } : { o: teams.o, x: "" },
	target: $teams
});

// размеры поля
export const $field = createStore<GameField>([], { name: "field" });
export const $height = createStore<number>(0, { name: "height" });
export const setFieldSizeHandler = createEvent<GameFieldSizeSelect>("setFieldSizeHandler");
export const setFieldSize = createEvent<GameFieldSizeSelect>();

sample({
	clock: setFieldSizeHandler,
	source: { state: $gameState, teams: $teams },
	filter: ({ state, teams }, { player, width, height }) => [
		state === "lobby",
		isPlayer(teams, player),
		Number.isInteger(width),
		Number.isInteger(height),
		width > 4,
		height > 4,
		width < 20,
		height < 20
	].every(e => e),
	fn: (_, data) => data,
	target: setFieldSize
});

sample({
	clock: setFieldSize,
	fn: ({ width }) => Array.from({ length: width }).map(() => []),
	target: $field
});

sample({
	clock: setFieldSize,
	fn: ({ height }) => height,
	target: $height
});

// старт игры по нажатию кнопки start, если есть команды
sample({
	clock: setFieldSize,
	source: $teams,
	filter: teams => Boolean(teams.x) && Boolean(teams.o),
	fn: () => "game" as GameState,
	target: $gameState
});

// процесс игры
export const moveHandler = createEvent<GameTurn>("moveHandler");
export const move = createEvent<GameTurn>("move");
export const $turnTeam = createStore<GameLoopState>("" as GameLoopState, { name: "turnTeam" });

// при запуске игры первым ходит команда x
sample({
	clock: $gameState,
	filter: state => state === "game",
	fn: () => "x" as GameLoopState,
	target: $turnTeam
});

sample({
	clock: moveHandler,
	source: { state: $gameState, teams: $teams, fields: $field, height: $height, turnTeam: $turnTeam },
	filter: ({ state , teams, fields, height, turnTeam }, { player, column }) => [
		state === "game",
		isPlayer(teams, player),
		getPlayerTeam(teams, player) === turnTeam,
		Number.isInteger(column),
		column < fields.length,
		fields[column].length < height
	].every(e => e),
	fn: (_, data) => data,
	target: move
});

const checkWinAfterTurn = createEvent<GameTurnResult>();

sample({
	clock: move,
	source: { fields: $field, turnTeam: $turnTeam },
	fn: ({ fields, turnTeam }, { column }) => {
		const map = fields.slice();
		const row = map[column].push(turnTeam);
		return { map, row, column, turnTeam };
	},
	target: checkWinAfterTurn
});

const updateField = createEvent<FieldPatch>();

sample({
	clock: checkWinAfterTurn,
	source: { state: $gameState, fields: $field, turnTeam: $turnTeam },
	filter: ({ state }, patch) => state === "game",
	fn: ({ turnTeam }, { map, column, row }) => {
		const sequence: Sequence = checkWinPoints(map, column, row, turnTeam, 4); // возвращает массив всегда
		if (sequence.length === 0) return { map };
		const team = turnTeam.toUpperCase() as Uppercase<Team>;
		sequence.forEach(([row, col]) => { map[row][col] = team });
		return { map, sequence };
	},
	target: updateField
});

sample({
	clock: updateField,
	fn: ({ map }) => map,
	target: $field
});

sample({
	clock: updateField,
	filter: ({ sequence }) => Boolean(sequence),
	fn: () => "finish" as GameState,
	target: $gameState
});

// если нет победителя, передаем ход другой команде
sample({
	clock: updateField,
	source: $turnTeam,
	filter: (_, { sequence }) => !Boolean(sequence),
	fn: turnTeam => getOppositeTeam(turnTeam),
	target: $turnTeam
});

// если игра закончена то отправим сообщение о победителе
// TODO: в этом файле нехорошо делать бродкаст
sample({
	clock: $gameState,
	source: { turnTeam: $turnTeam, teams: $teams },
	filter: ({ turnTeam, teams }, state) => Boolean(teams.x) && Boolean(teams.o) && Boolean(turnTeam) && state === "finish",
	fn: ({ turnTeam, teams }) => {
		const opposite = getOppositeTeam(turnTeam);
		const winner = teams[turnTeam];
		const looser = teams[opposite];

		const data: GameFinish = {
			[turnTeam]: { status: "win", player: winner },
			[opposite]: { status: "loose", player: looser }
		} as GameFinish;

		room.broadcast("finish", data);
	}
});

// TODO: добавить проверку на ничью
