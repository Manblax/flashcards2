import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TtsController } from './tts.controller';
import { TtsService } from './tts.service';

@Module({
  imports: [PrismaModule],
  controllers: [TtsController],
  providers: [TtsService],
})
export class TtsModule {}
