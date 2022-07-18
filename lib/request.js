/* eslint-disable import/prefer-default-export */

import { gql, request } from 'graphql-request';

export async function fetchRecentVideos(cursor) {
  const { recentVideos } = await request(
    '/api',
    gql`
      query Query {
        recentVideos(limit: ${process.env.NEXT_PUBLIC_VIDEO_GRID_COUNT}, cursor: ${cursor}) {
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
            nextPage
          }
        }
      }
    `
  );

  return recentVideos;
}
