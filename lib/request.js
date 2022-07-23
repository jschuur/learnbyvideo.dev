/* eslint-disable import/prefer-default-export */

import { request } from 'graphql-request';

import defaultGraphQLVariables from '../graphql/defaults';
import { recentVideosQuery } from '../graphql/queries';

export async function fetchRecentVideos({ pageParam: offset = 0 }) {
  const { recentVideos } = await request('/api', recentVideosQuery, { ...defaultGraphQLVariables, offset });

  return recentVideos;
}
