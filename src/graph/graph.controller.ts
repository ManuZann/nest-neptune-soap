// src/graph/graph.controller.ts
import { Controller, Get, Inject } from '@nestjs/common';
import * as gremlinProvider from './gremlin.provider';

@Controller('graph')
export class GraphController {
  constructor(@Inject('GREMLIN') private readonly gremlin: gremlinProvider.GremlinConn) {}

  @Get('vertices')
  async allVertices() {
    const { g } = this.gremlin;
    const res = await g.V().valueMap(true).toList();
    return res.map((m: Map<string, any>) => {
      const obj: Record<string, any> = {};
      for (const [k, v] of m.entries()) {
        obj[k] = Array.isArray(v) && v.length === 1 ? v[0] : v;
      }
      return obj;
    });
  }

  @Get('edges')
  async allEdges() {
    const { g } = this.gremlin;
    const res = await g.E().valueMap(true).toList();
    return res.map((m: Map<string, any>) => {
      const obj: Record<string, any> = {};
      for (const [k, v] of m.entries()) {
        obj[k] = Array.isArray(v) && v.length === 1 ? v[0] : v;
      }
      return obj;
    });
  }
}
