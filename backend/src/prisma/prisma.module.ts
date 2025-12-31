import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Делаем модуль глобальным, чтобы не импортировать его везде
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
