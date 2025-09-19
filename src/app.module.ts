import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CandidatesModule } from './candidates/candidates.module';
import { GraphModule } from './graph/graph.module';

@Module({
  imports: [GraphModule, CandidatesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
