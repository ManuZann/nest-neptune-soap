import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CandidatesService } from './candidates.service';

@Controller('candidates')
export class CandidatesController {
  constructor(private readonly svc: CandidatesService) {}

  @Post()
  create(@Body() body: { id: string; name: string; email: string }) {
    return this.svc.createCandidate(body);
  }

  @Post(':id/skills')
  addSkill(@Param('id') id: string, @Body() body: { skillName: string }) {
    return this.svc.addSkill({ candidateId: id, skillName: body.skillName });
  }

  @Get('skill/:name')
  bySkill(@Param('name') name: string) {
    return this.svc.findBySkill(name);
  }
}
