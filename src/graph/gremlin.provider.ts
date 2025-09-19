import { Provider } from '@nestjs/common';
import { driver, process as gprocess } from 'gremlin';

export type GremlinConn = {
  g: gprocess.GraphTraversalSource<any, any>;
  connection: driver.DriverRemoteConnection;
};

export const GremlinProvider: Provider<GremlinConn> = {
  provide: 'GREMLIN',
  useFactory: async () => {
    const endpoint = process.env.GREMLIN_ENDPOINT ?? 'ws://localhost:8182/gremlin';
    const connection = new driver.DriverRemoteConnection(endpoint, {});
    const g = gprocess.traversal().withRemote(connection);
    return { g, connection };
  },
};
