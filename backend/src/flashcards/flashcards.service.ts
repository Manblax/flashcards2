import { Injectable } from '@nestjs/common';
import { CreateFlashcardDto } from './dto/create-flashcard.dto';
import { UpdateFlashcardDto } from './dto/update-flashcard.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FlashcardsService {
  constructor(private prisma: PrismaService) {}

  create(createFlashcardDto: CreateFlashcardDto) {
    // Создаем модуль вместе с терминами
    return this.prisma.module.create({
      data: {
        title: createFlashcardDto.title,
        description: createFlashcardDto.description,
        author: createFlashcardDto.author || 'Anonymous',
        termCount: createFlashcardDto.terms?.length || 0,
        terms: {
          create: createFlashcardDto.terms?.map((term) => ({
            term: term.term,
            definition: term.definition,
            image: term.image,
          })),
        },
      },
      include: {
        terms: true,
      },
    });
  }

  findAll(skip?: number, take?: number) {
    return this.prisma.module.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.module.findUnique({
      where: { id },
      include: {
        terms: true,
      },
    });
  }

  async update(id: string, updateFlashcardDto: UpdateFlashcardDto) {
    const { terms, ...moduleData } = updateFlashcardDto;

    return this.prisma.$transaction(async (tx) => {
      // 1. Обновляем данные модуля
      const updatedModule = await tx.module.update({
        where: { id },
        data: {
          ...moduleData,
          termCount: terms ? terms.length : undefined,
        },
      });

      // 2. Если переданы термины, перезаписываем их (удаляем старые, создаем новые)
      if (terms) {
        await tx.term.deleteMany({
          where: { moduleId: id },
        });

        if (terms.length > 0) {
          await tx.term.createMany({
            data: terms.map((term) => ({
              term: term.term,
              definition: term.definition,
              image: term.image,
              moduleId: id,
            })),
          });
        }
      }

      return updatedModule;
    });
  }

  remove(id: string) {
    return this.prisma.module.delete({
      where: { id },
    });
  }
}
