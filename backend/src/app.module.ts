import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FlashcardsModule } from './flashcards/flashcards.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [FlashcardsModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
