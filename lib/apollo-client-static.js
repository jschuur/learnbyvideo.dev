import { ApolloClient, InMemoryCache, NormalizedCacheObject } from '@apollo/client';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { SchemaLink } from '@apollo/client/link/schema';

import { typeDefs } from '../graphql/typedefs.js';
import { resolvers } from '../graphql/resolvers.js';

export function createStaticApolloClient(context) {
  return new ApolloClient({
    ssrMode: true,
    link: new SchemaLink({ schema: makeExecutableSchema({ typeDefs, resolvers }), context }),
    cache: new InMemoryCache({}),
  });
}
