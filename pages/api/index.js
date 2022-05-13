import { ApolloServer } from 'apollo-server-micro';
import Cors from 'micro-cors';

import { typeDefs } from '../../graphql/schema.js';
import { resolvers } from '../../graphql/resolvers.js';
import { createContext } from '../../graphql/context.js';

const cors = Cors();

const apolloServer = new ApolloServer({ typeDefs, resolvers, context: createContext });

const startServer = apolloServer.start();

export default cors(async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.end();
    return false;
  }
  await startServer;

  await apolloServer.createHandler({
    path: '/api',
  })(req, res);
});

export const config = {
  api: {
    bodyParser: false,
  },
};
