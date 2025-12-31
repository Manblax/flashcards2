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

  findAll() {
    return this.prisma.module.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { terms: true },
        },
      },
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

  update(id: string, updateFlashcardDto: UpdateFlashcardDto) {
    // Это упрощенная логика обновления. 
    // В реальности нужно умнее обновлять термины (создавать новые, удалять старые, обновлять существующие).
    // Пока просто обновим поля модуля.
    return this.prisma.module.update({
      where: { id },
      data: {
        title: updateFlashcardDto.title,
        description: updateFlashcardDto.description,
      },
    });
  }

  remove(id: string) {
    return this.prisma.module.delete({
      where: { id },
    });
  }
}
