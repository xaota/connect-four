import React, { FC, useCallback } from "react";

interface RoomRowProps {
	row: ("x"|"o"|"X"|"O")[],
	index: number,
	canTurn: boolean,
	height: number
	onMove: (index: number) => void
}
const RoomRow: FC<RoomRowProps> = ({row, index, canTurn, height, onMove}) => {
	const canTurnHere = row.length < height && canTurn;
	const onClick = useCallback(() => {
		if (!canTurnHere) return;
		onMove(index);
	}, [canTurnHere]);

	return (
		<div className={"game-row _"+(canTurnHere?"active":"not-active")} onClick={onClick}>
			{row.map((item, index) => (
				<div key={index} className={"game-item _"+item}>
					{item}
				</div>
			))}
			{Array.from({length: height-row.length}).map((_, index) => (
				<div key={index} className="game-item _empty">
					#
				</div>
			))}
		</div>
	)
}

export default RoomRow;
