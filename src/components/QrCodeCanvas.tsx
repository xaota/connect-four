import React, {
	FC,
	useEffect,
	useRef,
	CanvasHTMLAttributes,
} from "react";
import qrcode from "qrcode";

interface QrCodeProps extends CanvasHTMLAttributes<HTMLCanvasElement> {
	data: string
}
export const QrCodeCanvas: FC<QrCodeProps> = ({data, ...canvasProps}) => {
	const canvasRef = useRef<HTMLCanvasElement>();
	useEffect(() => {
		if (!canvasRef.current) return;
		qrcode.toCanvas(canvasRef.current, data, {margin: 0, width: Number(canvasProps.width)});
	}, [data])
	return <canvas {...canvasProps} ref={canvasRef}/>
}
