import { Test, TestingModule } from '@nestjs/testing';
import { FlashcardsController } from './flashcards.controller';
import { FlashcardsService } from './flashcards.service';
import type { JwtUser } from '../auth/interfaces/jwt-user.interface';

describe('FlashcardsController', () => {
  let controller: FlashcardsController;
  let flashcardsService: {
    findAll: jest.Mock;
  };

  const user: JwtUser = {
    userId: 'user-1',
    username: 'alice',
  };

  beforeEach(async () => {
    flashcardsService = {
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FlashcardsController],
      providers: [
        {
          provide: FlashcardsService,
          useValue: flashcardsService,
        },
      ],
    }).compile();

    controller = module.get<FlashcardsController>(FlashcardsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('passes the authenticated user into list queries', async () => {
    flashcardsService.findAll.mockResolvedValue([]);

    await controller.findAll(user, '10', '5');

    expect(flashcardsService.findAll).toHaveBeenCalledWith(user, 10, 5);
  });
});
