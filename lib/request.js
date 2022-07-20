/* eslint-disable import/prefer-default-export */

import { gql, request } from 'graphql-request';

export async function fetchRecentVideos({ pageParam: offset = 0 }) {
  const { recentVideos } = await request(
    '/api',
    gql`
      query Query {
        recentVideos(limit: ${process.env.NEXT_PUBLIC_VIDEO_GRID_COUNT}, offset: ${offset}) {
          videos {
            title
            status
            youtubeId
            updatedAt
            publishedAt
            scheduledStartTime
            actualStartTime
            createdAt
            duration
            type
            channel {
              channelName
              type
            }
          }
          pageInfo {
            nextOffset
          }
        }
      }
    `
  );

  return recentVideos;
}
