/* eslint-disable import/prefer-default-export */

import { GraphQLClient } from 'graphql-request';

import defaultGraphQLVariables from '../graphql/defaults';
import { recentVideosQuery } from '../graphql/queries';

// GET requests allow us to use Vercel Edge Network caching
const graphQLClient = new GraphQLClient('/api', {
  method: 'GET',
  jsonSerializer: {
    parse: JSON.parse,
    stringify: JSON.stringify,
  },
});

export async function fetchRecentVideos({ pageParam: offset = 0 }) {
  // const data = await graphQLClient.request(recentVideosQuery, { ...defaultGraphQLVariables, offset });
  const { recentVideos } = await graphQLClient.request(recentVideosQuery, { ...defaultGraphQLVariables, offset });

  return recentVideos;
}
