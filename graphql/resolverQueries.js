import { ChannelStatus, VideoStatus } from '@prisma/client';
import PGTsquery from 'pg-tsquery';

import config from '../backend/config.mjs';

const searchTermParser = new PGTsquery.Tsquery();

export const channel = (_parent, _args, ctx) =>
	ctx.prisma.channel.findUnique({
		where: { id: parseInt(_args.id, 10) },
		include: { links: true },
	});

export const allChannels = (_parent, _args, ctx) =>
	ctx.prisma.channel.findMany({
		where: {
			NOT: {
				status: {
					in: [ChannelStatus.HIDDEN, ChannelStatus.ARCHIVED],
				},
			},
		},
		include: { links: true },
	});

export const channelCount = (_parent, _args, ctx) => ctx.prisma.channel.count();

export const video = (_parent, _args, ctx) =>
	ctx.prisma.video.findUnique({
		where: { id: parseInt(_args.id, 10) },
		include: { channel: true },
	});

export const videoCount = (_parent, _args, ctx) => ctx.prisma.video.count();

export async function recentVideos(_parent, _args, ctx) {
	const { offset = 0 } = _args;
	const take = Math.min(_args.limit, config.GRAPHQL_MAX_RECENT_VIDEOS);

	const query = {
		where: {
			channel: {
				NOT: {
					status: {
						in: [ChannelStatus.HIDDEN, ChannelStatus.ARCHIVED],
					},
				},
			},
			status: {
				in: [VideoStatus.UPCOMING, VideoStatus.LIVE, VideoStatus.PUBLISHED],
			},
		},
		include: {
			channel: {
				include: {
					links: true,
				},
			},
		},
		orderBy: {
			sortTime: 'desc',
		},
		skip: offset,
		take,
	};

	const videos = await ctx.prisma.video.findMany(query);

	return {
		videos,
		pageInfo: {
			count: videos.length,
			nextOffset: offset + take,
		},
	};
}

export const searchVideos = (_parent, _args, ctx) =>
	ctx.prisma.video.findMany({
		where: {
			title: { search: searchTermParser.parseAndStringify(_args.term) },
			type: _args.videoType || undefined,
		},
		orderBy: { [_args.orderBy]: _args.orderDirection },
		include: { channel: { include: { links: true } } },
		take: Math.trunc(Math.min(config.GRAPHQL_MAX_SEARCH_RESULTS_LIMIT, _args.limit)),
		skip: _args.offset,
	});
