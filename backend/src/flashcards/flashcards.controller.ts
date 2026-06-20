import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FlashcardsService } from './flashcards.service';
import { CreateFlashcardDto } from './dto/create-flashcard.dto';
import { UpdateFlashcardDto } from './dto/update-flashcard.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/interfaces/jwt-user.interface';

@ApiTags('Flashcards')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('flashcards')
export class FlashcardsController {
  constructor(private readonly flashcardsService: FlashcardsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a flashcard module' })
  @ApiResponse({ status: 201, description: 'Module created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @CurrentUser() user: JwtUser,
    @Body() createFlashcardDto: CreateFlashcardDto,
  ) {
    return this.flashcardsService.create(user, createFlashcardDto);
  }

  @Get()
  @ApiOperation({ summary: "List the current user's flashcard modules" })
  @ApiQuery({ name: 'skip', required: false, type: Number, minimum: 0 })
  @ApiQuery({ name: 'take', required: false, type: Number, minimum: 1 })
  findAll(
    @CurrentUser() user: JwtUser,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.flashcardsService.findAll(
      user,
      skip ? parseInt(skip, 10) : undefined,
      take ? parseInt(take, 10) : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a flashcard module' })
  @ApiResponse({ status: 404, description: 'Module not found' })
  findOne(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.flashcardsService.findOne(user, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a flashcard module' })
  @ApiResponse({ status: 404, description: 'Module not found' })
  update(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() updateFlashcardDto: UpdateFlashcardDto,
  ) {
    return this.flashcardsService.update(user, id, updateFlashcardDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a flashcard module' })
  @ApiResponse({ status: 404, description: 'Module not found' })
  remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.flashcardsService.remove(user, id);
  }
}
