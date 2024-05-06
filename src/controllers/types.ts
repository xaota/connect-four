export type Team = "x" | "o";
export type GameTeams = Record<Team, string>;

export type GameState = "lobby" | "game" | "finish";
export type GameLoopState = Team;

export type TeamSelect = { player: string, team: Team | null };

export type GameField = Array<Array<Team | Uppercase<Team>>>;
export type GameFieldSizeSelect = { player: string, width: number, height: number };

export type GameTurn = { player: string, column: number };
export type GameTurnResult = { map: GameField, row: number, column: number };

export type Sequence = Array<[number, number]>;

export type FieldPatch = { map: GameField, sequence?: Sequence };

export type GameFinish = Record<Team, { status: "win" | "loose" | "draw", player: string }>;
