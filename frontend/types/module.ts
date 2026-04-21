export interface Term {
  id: string;
  term: string;
  definition: string;
  image?: string;
  isFavorite?: boolean;
}

export interface Module {
  id: string;
  title: string;
  description?: string;
  termCount: number;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  terms?: Term[];
}
