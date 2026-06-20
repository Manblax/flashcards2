import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DictionaryController } from './dictionary.controller';

describe('DictionaryController', () => {
  it('rejects invalid lookup words', async () => {
    const controller = new DictionaryController({} as any);

    await expect(controller.lookup('!!!')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects invalid dictionary sources', async () => {
    const controller = new DictionaryController({} as any);

    await expect(controller.lookup('run', 'invalid')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects unknown audio ids', async () => {
    const controller = new DictionaryController({
      findAudio: jest.fn().mockResolvedValue(null),
    } as any);

    await expect(controller.audio('missing', {} as any)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
