import { ApolloClient, InMemoryCache } from '@apollo/client';
import { SchemaLink } from '@apollo/client/link/schema';
import { makeExecutableSchema } from '@graphql-tools/schema';

import { resolvers } from '../graphql/resolvers.js';
import { typeDefs } from '../graphql/typedefs.js';

export function createStaticApolloClient(context) {
  return new ApolloClient({
    ssrMode: true,
    link: new SchemaLink({ schema: makeExecutableSchema({ typeDefs, resolvers }), context }),
    cache: new InMemoryCache({}),
  });
}
