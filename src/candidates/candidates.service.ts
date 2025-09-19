import { Injectable } from '@nestjs/common';
import { CandidateRepo } from './candidate.repo';

@Injectable()
export class CandidatesService {
  constructor(private readonly repo: CandidateRepo) {}

  createCandidate(dto: { id: string; name: string; email: string }) {
    return this.repo.createCandidate(dto.id, dto.name, dto.email);
  }

  addSkill(dto: { candidateId: string; skillName: string }) {
    return this.repo.addSkill(dto.candidateId, dto.skillName);
  }

  findBySkill(skillName: string) {
    return this.repo.findBySkill(skillName);
  }

  getAllCandidates() {
    return this.repo.getAllCandidates();
  }
}
