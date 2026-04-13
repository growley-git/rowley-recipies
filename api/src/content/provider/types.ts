export type RecipeGraphQLNode = {
  id: string;
  title: string;
  slug: string;
  publishedAt: Date | null;
  aiSummary: string | null;
  ingredients: Array<{
    id: string;
    sortOrder: number;
    section: string | null;
    foodName: string;
    unit: string;
    amount: number;
    note: string | null;
  }>;
  steps: Array<{ id: string; sortOrder: number; text: string }>;
  tags: Array<{ tag: { id: string; name: string; slug: string } }>;
};

export type RecipeFilter = {
  publishedOnly?: boolean;
  tagSlug?: string;
  search?: string;
};

export interface RecipeContentProvider {
  readonly source: "db" | "files";

  supportsRecipeMutations(): boolean;

  findFirst(args: {
    id?: string;
    slug?: string;
  }): Promise<RecipeGraphQLNode | null>;

  findRecipesConnection(args: {
    filter: RecipeFilter;
    first: number;
    after: string | null | undefined;
  }): Promise<{
    edges: { cursor: string; node: RecipeGraphQLNode }[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    totalCount: number;
  }>;

  listTags(): Promise<{ id: string; name: string; slug: string }[]>;

  findRecipeMetaByIds(
    ids: string[]
  ): Promise<{ id: string; title: string; slug: string }[]>;

  findForGrocery(recipeId: string): Promise<{
    id: string;
    publishedAt: Date | null;
    ingredients: Array<{
      foodName: string;
      unit: string;
      amount: number;
      note: string | null;
    }>;
  } | null>;

  findTitle(recipeId: string): Promise<{ title: string } | null>;

  findForSummarize(recipeId: string): Promise<{
    aiSummary: string | null;
    steps: { text: string }[];
  } | null>;
}
