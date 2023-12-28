import Image from 'next/image';

const thumbnailResolutions = {
	default: {
		prefix: '',
		width: 120,
		height: 90,
	},
	medium: {
		prefix: 'mq',
		width: 320,
		height: 180,
	},
	high: {
		prefix: 'hq',
		width: 480,
		height: 360,
	},
	standard: {
		prefix: 'sd',
		width: 640,
		height: 480,
	},
	maxres: {
		prefix: 'maxres',
		width: 1280,
		height: 720,
	},
};

export default function VideoThumbnail({ res = 'medium', youtubeId, alt }) {
	const { width, height } = thumbnailResolutions[res];

	return (
		<Image
			width={width}
			height={height}
			src={`https://i.ytimg.com/vi/${youtubeId}/${thumbnailResolutions[res].prefix}default.jpg`}
			alt={alt}
			unoptimized
			sizes="100vw"
			style={{
				width: '100%',
				height: 'auto',
			}}
		/>
	);
}
