import { ApolloClient, InMemoryCache } from '@apollo/client';
import { SchemaLink } from '@apollo/client/link/schema';
import { makeExecutableSchema } from '@graphql-tools/schema';

import context from '../graphql/context';
import resolvers from '../graphql/resolvers';
import typeDefs from '../graphql/typedefs';

// eslint-disable-next-line import/prefer-default-export
const createLocalApolloClient = () =>
	new ApolloClient({
		ssrMode: true,
		link: new SchemaLink({ schema: makeExecutableSchema({ typeDefs, resolvers }), context }),
		cache: new InMemoryCache({}),
	});

export default createLocalApolloClient;
