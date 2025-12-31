export class CreateTermDto {
  term: string;
  definition: string;
  image?: string;
}

export class CreateFlashcardDto {
  title: string;
  description?: string;
  author?: string;
  terms?: CreateTermDto[];
}
