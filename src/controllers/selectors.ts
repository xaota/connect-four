import type { GameField, GameTeams, Sequence, Team } from "./types";
import { resolveTxt } from "node:dns";

export const getPlayerTeam = (teams: GameTeams, player: string): Team | undefined => Object
	.entries(teams)
	.filter(([team, temp]) => player === temp)
	.at(0)
	.at(0) as Team | undefined;

export const getOppositeTeam = (team: Team): Team => team === "x" ? "o" : "x";

export const isPlayer = (teams: GameTeams, player: string): boolean => Object.values(teams).includes(player);

export function checkWinPoints(map: ("x"|"o"|"X"|"O")[][], colNumber: number, rowNumber: number, team: "x"|"o", winLength: number): null | [number, number][]{
	const totalWinPoints: Sequence = [];
	const directions: [number, number][] = [[0, 1], [1, 1], [1, 0], [1, -1]];
	for (const dir of directions) {
		const winPoints = [];
		let point = [colNumber, rowNumber];
		while (true) {
			const value = map[point[0]]?.[point[1]];
			if (value !== team) break;
			winPoints.push(point);
			point = [point[0]+dir[0], point[1]+dir[1]]
		}
		point = [colNumber-dir[0], rowNumber-dir[1]];
		while (true) {
			const value = map[point[0]]?.[point[1]];
			if (value !== team) break;
			winPoints.push(point);
			point = [point[0]-dir[0], point[1]-dir[1]]
		}
		if (winPoints.length >= winLength) totalWinPoints.push(...winPoints);
	}
	if (totalWinPoints.length === 0) return [];
	return totalWinPoints;
}
