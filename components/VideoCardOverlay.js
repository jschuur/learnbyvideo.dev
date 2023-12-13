import { youtubeDuration } from '../lib/util';

export default function VideoCardOverlay({ duration, type, status }) {
	let overlayBackground = 'red';
	let overlayText;

	if (type === 'SHORT') {
		overlayText = 'SHORT';
	} else if (status === 'LIVE') {
		overlayText = duration === 'P0D' ? '\u25CF LIVE' : '\u25CF PREMIERE';
	} else if (status === 'UPCOMING') {
		overlayBackground = 'black';
		overlayText = '\u23F0 UPCOMING';
	} else {
		overlayBackground = 'black';
		overlayText = youtubeDuration(duration);
	}

	return (
		<div
			className={`absolute ${
				overlayBackground === 'red' ? 'bg-red-500' : 'bg-black/80'
			} text-white font-roboto font-medium text-[10px] md:text-[12px] tracking-[0.5px] bottom-0 right-0 mx-[3px] md:mx-[4px] my-[3px] md:my-[4px] px-[3px] py-[0px] rounded-sm`}
		>
			{overlayText}
		</div>
	);
}
