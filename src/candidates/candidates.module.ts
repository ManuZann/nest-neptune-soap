import { Module } from '@nestjs/common';
import { CandidateRepo } from './candidate.repo';
import { CandidatesService } from './candidates.service';
import { CandidatesController } from './candidates.controller';

@Module({
  providers: [CandidateRepo, CandidatesService],
  controllers: [CandidatesController],
})
export class CandidatesModule {}
