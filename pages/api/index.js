import { makeExecutableSchema } from '@graphql-tools/schema';
import { ApolloServer } from 'apollo-server-micro';
import Cors from 'micro-cors';

import { createContext } from '../../graphql/context';
import resolvers from '../../graphql/resolvers';
import typeDefs from '../../graphql/typedefs';

const cors = Cors();

const apolloServer = new ApolloServer({
  schema: makeExecutableSchema({ typeDefs, resolvers }),
  context: createContext,
});

const startServer = apolloServer.start();

export default cors(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.end();
  } else {
    await startServer;

    await apolloServer.createHandler({
      path: '/api',
    })(req, res);
  }
});

export const config = {
  api: {
    bodyParser: false,
  },
};
