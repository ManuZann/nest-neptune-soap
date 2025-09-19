import { Global, Module } from '@nestjs/common';
import { GremlinProvider } from './gremlin.provider';
import { GraphController } from './graph.controller';

@Global()
@Module({
  providers: [GremlinProvider],
  controllers: [GraphController],
  exports: ['GREMLIN'],
})
export class GraphModule {}
