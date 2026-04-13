import type { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import type {
  RecipeContentProvider,
  RecipeFilter,
  RecipeGraphQLNode,
} from "./types.js";

const recipeInclude = {
  ingredients: { orderBy: { sortOrder: "asc" as const } },
  steps: { orderBy: { sortOrder: "asc" as const } },
  tags: { include: { tag: true } },
} as const;

function asNode(
  row: Prisma.RecipeGetPayload<{ include: typeof recipeInclude }>
): RecipeGraphQLNode {
  return row as unknown as RecipeGraphQLNode;
}

export class PrismaRecipeContentProvider implements RecipeContentProvider {
  readonly source = "db" as const;

  constructor(private readonly prisma: PrismaClient) {}

  supportsRecipeMutations(): boolean {
    return true;
  }

  async findFirst(args: { id?: string; slug?: string | undefined }) {
    if (!args.id && !args.slug) return null;
    const row = await this.prisma.recipe.findFirst({
      where: args.id ? { id: args.id } : { slug: args.slug },
      include: recipeInclude,
    });
    return row ? asNode(row) : null;
  }

  async findRecipesConnection(args: {
    filter: RecipeFilter;
    first: number;
    after: string | null | undefined;
  }) {
    const filter = args.filter;
    const where: Prisma.RecipeWhereInput = {};
    if (filter.publishedOnly) {
      where.publishedAt = { not: null };
    }
    if (filter.tagSlug) {
      where.tags = { some: { tag: { slug: filter.tagSlug } } };
    }
    if (filter.search?.trim()) {
      const q = filter.search.trim();
      where.OR = [
        { title: { contains: q } },
        { steps: { some: { text: { contains: q } } } },
        { ingredients: { some: { foodName: { contains: q } } } },
      ];
    }

    const totalCount = await this.prisma.recipe.count({ where });
    const after = args.after;

    const rows =
      after != null && after !== ""
        ? await this.prisma.recipe.findMany({
            where,
            orderBy: { id: "desc" },
            take: args.first + 1,
            cursor: { id: after },
            skip: 1,
            include: recipeInclude,
          })
        : await this.prisma.recipe.findMany({
            where,
            orderBy: { id: "desc" },
            take: args.first + 1,
            include: recipeInclude,
          });

    const hasNextPage = rows.length > args.first;
    const nodes = hasNextPage ? rows.slice(0, args.first) : rows;
    const edges = nodes.map((r) => ({
      cursor: r.id,
      node: asNode(r),
    }));

    return {
      edges,
      pageInfo: {
        hasNextPage,
        endCursor: edges.length ? edges[edges.length - 1].cursor : null,
      },
      totalCount,
    };
  }

  async listTags() {
    return this.prisma.tag.findMany({ orderBy: { name: "asc" } });
  }

  async findRecipeMetaByIds(ids: string[]) {
    if (ids.length === 0) return [];
    return this.prisma.recipe.findMany({
      where: { id: { in: ids } },
      select: { id: true, title: true, slug: true },
    });
  }

  async findForGrocery(recipeId: string) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      include: { ingredients: true },
    });
    if (!recipe) return null;
    return {
      id: recipe.id,
      publishedAt: recipe.publishedAt,
      ingredients: recipe.ingredients.map((ing) => ({
        foodName: ing.foodName,
        unit: ing.unit,
        amount: ing.amount,
        note: ing.note,
      })),
    };
  }

  async findTitle(recipeId: string) {
    const r = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      select: { title: true },
    });
    return r;
  }

  async findForSummarize(recipeId: string) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      include: { steps: { orderBy: { sortOrder: "asc" } } },
    });
    if (!recipe) return null;
    return {
      aiSummary: recipe.aiSummary,
      steps: recipe.steps.map((s) => ({ text: s.text })),
    };
  }
}
