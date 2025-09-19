import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import type { GremlinConn } from '../graph/gremlin.provider';

@Injectable()
export class CandidateRepo implements OnModuleDestroy {
  constructor(@Inject('GREMLIN') private readonly gremlin: GremlinConn) {}

  async createCandidate(id: string, name: string, email: string) {
    const { g } = this.gremlin;
    await g.addV('candidate')
      .property('id', id)
      .property('name', name)
      .property('email', email)
      .next();
    return { id, name, email };
  }

  async addSkill(candidateId: string, skillName: string) {
    const { g } = this.gremlin;
    await g.V().has('candidate', 'id', candidateId).as('c')
      .coalesce(
        g.V().has('skill', 'name', skillName),
        g.addV('skill').property('name', skillName)
      )
      .addE('HAS_SKILL').from_('c')
      .next();
    return { candidateId, skillName };
  }

  async findBySkill(skillName: string) {
    const { g } = this.gremlin;
    const out = await g.V().has('skill', 'name', skillName)
      .in_('HAS_SKILL')
      .valueMap(true)
      .toList();
    return out.map((m: Map<string, any>) => ({
      id: m.get('id'),
      name: m.get('name')?.[0],
      email: m.get('email')?.[0],
    }));
  }

  onModuleDestroy() {
    this.gremlin?.connection?.close?.();
  }
}
