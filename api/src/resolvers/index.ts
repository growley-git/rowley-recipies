import { GraphQLError, GraphQLScalarType, Kind } from "graphql";
import {
  formatQuantity,
  mergeGroceryLines,
  mergeGroceryLinesWithSources,
} from "@rowley/domain";
import { assertAdmin, checkAdminPassword, signAdminToken } from "../auth.js";
import type { GraphQLContext } from "../context.js";
import {
  loadReviewStatsForSlug,
  loadReviewStatsMap,
  type ReviewStats,
} from "../reviewStats.js";
import { slugify } from "../slug.js";

function requireAdmin(ctx: GraphQLContext) {
  try {
    assertAdmin(ctx.authHeader);
  } catch {
    throw new GraphQLError("Unauthorized", {
      extensions: { code: "UNAUTHENTICATED" },
    });
  }
}

function requireDbRecipeSource(ctx: GraphQLContext) {
  if (!ctx.recipeContent.supportsRecipeMutations()) {
    throw new GraphQLError(
      "Recipe and tag mutations are disabled when RECIPE_SOURCE=files. Edit Markdown under content/recipes and run npm run content:import -w @rowley/api, or set RECIPE_SOURCE=db.",
      { extensions: { code: "BAD_USER_INPUT" } }
    );
  }
}

const aiEnabled = () => process.env.AI_FEATURES === "1";

const recipeInclude = {
  ingredients: { orderBy: { sortOrder: "asc" as const } },
  steps: { orderBy: { sortOrder: "asc" as const } },
  tags: { include: { tag: true } },
} as const;

function normalizeSteps(steps: Array<{ text: string }>): Array<{
  sortOrder: number;
  text: string;
}> {
  const trimmed = steps.map((s) => s.text.trim()).filter(Boolean);
  if (trimmed.length === 0) {
    throw new GraphQLError("At least one direction step is required.", {
      extensions: { code: "BAD_USER_INPUT" },
    });
  }
  return trimmed.map((text, i) => ({ sortOrder: i, text }));
}

async function groceryListPayloadForSession(ctx: GraphQLContext) {
  const raw = await ctx.prisma.groceryLine.findMany({
    where: { sessionKey: ctx.sessionKey },
    orderBy: { foodName: "asc" },
  });
  const merged = mergeGroceryLinesWithSources(
    raw.map((l) => ({
      foodName: l.foodName,
      unit: l.unit,
      amount: l.amount,
      note: l.note,
      recipeId: l.recipeId,
    }))
  );
  const allRecipeIds = [
    ...new Set(
      raw
        .map((r) => r.recipeId)
        .filter((id): id is string => Boolean(id?.trim()))
    ),
  ];
  const recipes =
    allRecipeIds.length === 0
      ? []
      : await ctx.recipeContent.findRecipeMetaByIds(allRecipeIds);
  const byId = new Map(recipes.map((r) => [r.id, r] as const));
  const lines = merged.map((m, idx) => ({
    id: `merged-${idx}`,
    foodName: m.foodName,
    unit: m.unit,
    amount: m.amount,
    display: formatQuantity(m.amount, m.unit),
    sourceRecipes: m.recipeIds
      .map((id) => byId.get(id))
      .filter((r): r is (typeof recipes)[number] => Boolean(r)),
  }));
  const selectedRecipes = allRecipeIds
    .map((id) => byId.get(id))
    .filter((r): r is (typeof recipes)[number] => Boolean(r))
    .sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
    );
  return { lines, selectedRecipes };
}

const DateTimeScalar = new GraphQLScalarType({
  name: "DateTime",
  description: "ISO-8601 date/time",
  serialize(value: unknown) {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "string") return value;
    return null;
  },
  parseValue(value: unknown) {
    if (typeof value === "string" || typeof value === "number") {
      return new Date(value);
    }
    return null;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) return new Date(ast.value);
    return null;
  },
});

export const resolvers = {
  DateTime: DateTimeScalar,

  Query: {
    async recipe(
      _: unknown,
      args: { id?: string; slug?: string },
      ctx: GraphQLContext
    ) {
      if (!args.id && !args.slug) return null;
      const r = await ctx.recipeContent.findFirst({
        id: args.id ?? undefined,
        slug: args.slug ?? undefined,
      });
      if (!r) return null;
      const statsMap = await loadReviewStatsMap(ctx.prisma, [r.slug]);
      const __reviewStats: ReviewStats =
        statsMap.get(r.slug) ?? { averageRating: null, reviewCount: 0 };
      return { ...r, __reviewStats };
    },

    async recipes(
      _: unknown,
      args: {
        filter?: { publishedOnly?: boolean; tagSlug?: string; search?: string };
        pagination?: { first?: number; after?: string };
      },
      ctx: GraphQLContext
    ) {
      const first = Math.min(args.pagination?.first ?? 20, 100);
      const after = args.pagination?.after;
      const filter = args.filter ?? {};
      const conn = await ctx.recipeContent.findRecipesConnection({
        filter: {
          publishedOnly: filter.publishedOnly,
          tagSlug: filter.tagSlug,
          search: filter.search,
        },
        first,
        after,
      });
      const slugs = conn.edges.map((e) => e.node.slug);
      const statsMap = await loadReviewStatsMap(ctx.prisma, slugs);
      return {
        ...conn,
        edges: conn.edges.map((e) => {
          const __reviewStats: ReviewStats =
            statsMap.get(e.node.slug) ?? {
              averageRating: null,
              reviewCount: 0,
            };
          return {
            ...e,
            node: { ...e.node, __reviewStats },
          };
        }),
      };
    },

    tags(_: unknown, __: unknown, ctx: GraphQLContext) {
      return ctx.recipeContent.listTags();
    },

    async groceryList(_: unknown, __: unknown, ctx: GraphQLContext) {
      return groceryListPayloadForSession(ctx);
    },

    aiFeatureFlags() {
      return {
        enabled: aiEnabled(),
        tagSuggestions: aiEnabled(),
        summaries: aiEnabled(),
      };
    },
  },

  Mutation: {
    login(_: unknown, args: { password: string }) {
      if (!checkAdminPassword(args.password)) {
        throw new GraphQLError("Invalid password", {
          extensions: { code: "FORBIDDEN" },
        });
      }
      const { token, expiresAt } = signAdminToken();
      return { token, expiresAt };
    },

    async createRecipe(
      _: unknown,
      args: {
        input: {
          title: string;
          slug: string;
          tagIds?: string[];
          steps: Array<{ text: string }>;
          ingredients: Array<{
            section?: string | null;
            foodName: string;
            unit: string;
            amount: number;
            note?: string | null;
          }>;
        };
      },
           ctx: GraphQLContext
    ) {
      requireAdmin(ctx);
      requireDbRecipeSource(ctx);
      const { input } = args;
      const stepRows = normalizeSteps(input.steps);
      const recipe = await ctx.prisma.recipe.create({
        data: {
          title: input.title,
          slug: input.slug,
          tags: input.tagIds?.length
            ? {
                create: input.tagIds.map((tagId) => ({
                  tag: { connect: { id: tagId } },
                })),
              }
            : undefined,
          ingredients: {
            create: input.ingredients.map((ing, i) => ({
              sortOrder: i,
              section: ing.section ?? undefined,
              foodName: ing.foodName,
              unit: ing.unit,
              amount: ing.amount,
              note: ing.note ?? undefined,
            })),
          },
          steps: {
            create: stepRows,
          },
        },
        include: recipeInclude,
      });
      return recipe;
    },

    async updateRecipe(
      _: unknown,
      args: {
        id: string;
        input: {
          title: string;
          slug: string;
          tagIds?: string[];
          steps: Array<{ text: string }>;
          ingredients: Array<{
            section?: string | null;
            foodName: string;
            unit: string;
            amount: number;
            note?: string | null;
          }>;
        };
      },
      ctx: GraphQLContext
    ) {
      requireAdmin(ctx);
      requireDbRecipeSource(ctx);
      const { id, input } = args;
      const stepRows = normalizeSteps(input.steps);
      await ctx.prisma.ingredientLine.deleteMany({ where: { recipeId: id } });
      await ctx.prisma.recipeStep.deleteMany({ where: { recipeId: id } });
      await ctx.prisma.recipeTag.deleteMany({ where: { recipeId: id } });

      return ctx.prisma.recipe.update({
        where: { id },
        data: {
          title: input.title,
          slug: input.slug,
          tags: input.tagIds?.length
            ? {
                create: input.tagIds.map((tagId) => ({
                  tag: { connect: { id: tagId } },
                })),
              }
            : undefined,
          ingredients: {
            create: input.ingredients.map((ing, i) => ({
              sortOrder: i,
              section: ing.section ?? undefined,
              foodName: ing.foodName,
              unit: ing.unit,
              amount: ing.amount,
              note: ing.note ?? undefined,
            })),
          },
          steps: {
            create: stepRows,
          },
        },
        include: recipeInclude,
      });
    },

    async deleteRecipe(
      _: unknown,
      args: { id: string },
      ctx: GraphQLContext
    ) {
      requireAdmin(ctx);
      requireDbRecipeSource(ctx);
      await ctx.prisma.recipe.delete({ where: { id: args.id } });
      return true;
    },

    async publishRecipe(
      _: unknown,
      args: { id: string },
      ctx: GraphQLContext
    ) {
      requireAdmin(ctx);
      requireDbRecipeSource(ctx);
      return ctx.prisma.recipe.update({
        where: { id: args.id },
        data: { publishedAt: new Date() },
        include: recipeInclude,
      });
    },

    async unpublishRecipe(
      _: unknown,
      args: { id: string },
      ctx: GraphQLContext
    ) {
      requireAdmin(ctx);
      requireDbRecipeSource(ctx);
      return ctx.prisma.recipe.update({
        where: { id: args.id },
        data: { publishedAt: null },
        include: recipeInclude,
      });
    },

    async upsertTag(
      _: unknown,
      args: { name: string },
      ctx: GraphQLContext
    ) {
      requireAdmin(ctx);
      requireDbRecipeSource(ctx);
      const slug = slugify(args.name);
      return ctx.prisma.tag.upsert({
        where: { slug },
        create: { name: args.name.trim(), slug },
        update: { name: args.name.trim() },
      });
    },

    async addRecipeToGroceryList(
      _: unknown,
      args: { recipeId: string },
      ctx: GraphQLContext
    ) {
      const recipe = await ctx.recipeContent.findForGrocery(args.recipeId);
      if (!recipe) {
        throw new GraphQLError("Recipe not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }
      if (!recipe.publishedAt) {
        throw new GraphQLError("Recipe is not published", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }

      await ctx.prisma.groceryLine.createMany({
        data: recipe.ingredients.map((ing) => ({
          sessionKey: ctx.sessionKey,
          foodName: ing.foodName,
          unit: ing.unit,
          amount: ing.amount,
          note: ing.note,
          recipeId: recipe.id,
        })),
      });

      const payload = await groceryListPayloadForSession(ctx);
      return {
        lineCount: payload.lines.length,
        lines: payload.lines,
        selectedRecipes: payload.selectedRecipes,
      };
    },

    async removeGroceryLine(
      _: unknown,
      args: { id: string },
      ctx: GraphQLContext
    ) {
      const raw = await ctx.prisma.groceryLine.findMany({
        where: { sessionKey: ctx.sessionKey },
      });
      if (args.id.startsWith("merged-")) {
        const merged = mergeGroceryLines(
          raw.map((l) => ({
            foodName: l.foodName,
            unit: l.unit,
            amount: l.amount,
            note: l.note,
          }))
        );
        const idx = Number.parseInt(args.id.replace(/^merged-/, ""), 10);
        const line = merged[idx];
        if (!line) return false;
        await removeMergedLine(ctx, raw, line);
        return true;
      }
      const deleted = await ctx.prisma.groceryLine.deleteMany({
        where: { id: args.id, sessionKey: ctx.sessionKey },
      });
      return deleted.count > 0;
    },

    async clearGroceryList(_: unknown, __: unknown, ctx: GraphQLContext) {
      await ctx.prisma.groceryLine.deleteMany({
        where: { sessionKey: ctx.sessionKey },
      });
      return true;
    },

    async suggestTagsForRecipe(
      _: unknown,
      args: { recipeId: string },
      ctx: GraphQLContext
    ) {
      requireAdmin(ctx);
      if (!aiEnabled()) {
        return [];
      }
      const recipe = await ctx.recipeContent.findTitle(args.recipeId);
      if (!recipe) {
        throw new GraphQLError("Recipe not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }
      const words = recipe.title
        .toLowerCase()
        .split(/\W+/)
        .filter((w) => w.length > 3);
      const allTags = await ctx.recipeContent.listTags();
      if (words.length === 0) {
        return allTags.slice(0, 5);
      }
      const pool = allTags.filter((t) =>
        words.some((w) => t.name.toLowerCase().includes(w))
      );
      if (pool.length) return pool.slice(0, 8);
      return allTags.slice(0, 5);
    },

    async submitRecipeReview(
      _: unknown,
      args: {
        recipeSlug: string;
        input: { rating: number; body?: string | null; authorName?: string | null };
      },
      ctx: GraphQLContext
    ) {
      const slug = args.recipeSlug.trim();
      if (!slug) {
        throw new GraphQLError("recipeSlug is required", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }
      const recipe = await ctx.recipeContent.findFirst({ slug });
      if (!recipe?.publishedAt) {
        throw new GraphQLError("Recipe not found or not published", {
          extensions: { code: "NOT_FOUND" },
        });
      }
      const rating = args.input.rating;
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        throw new GraphQLError("Rating must be a whole number from 1 to 5", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }
      const bodyRaw = args.input.body?.trim() ?? "";
      const body = bodyRaw.length ? bodyRaw : null;
      if (body && body.length > 2000) {
        throw new GraphQLError("Review text must be 2000 characters or less", {
          extensions: { code: "BAD_USER_INPUT" },
        });
      }
      const authorRaw = args.input.authorName?.trim() ?? "";
      const authorName = authorRaw.length ? authorRaw.slice(0, 80) : null;

      const row = await ctx.prisma.recipeReview.upsert({
        where: {
          recipeSlug_sessionKey: {
            recipeSlug: recipe.slug,
            sessionKey: ctx.sessionKey,
          },
        },
        create: {
          recipeSlug: recipe.slug,
          sessionKey: ctx.sessionKey,
          rating,
          body,
          authorName,
        },
        update: {
          rating,
          body,
          authorName,
        },
      });

      return {
        id: row.id,
        rating: row.rating,
        body: row.body,
        authorName: row.authorName,
        createdAt: row.createdAt,
        mine: true,
      };
    },

    async summarizeRecipe(
      _: unknown,
      args: { recipeId: string },
      ctx: GraphQLContext
    ) {
      requireAdmin(ctx);
      const recipe = await ctx.recipeContent.findForSummarize(args.recipeId);
      if (!recipe) {
        throw new GraphQLError("Recipe not found", {
          extensions: { code: "NOT_FOUND" },
        });
      }
      const directionsText = recipe.steps.map((s) => s.text).join("\n");
      if (!aiEnabled()) {
        return (
          directionsText.slice(0, 240) +
          (directionsText.length > 240 ? "…" : "")
        );
      }
      const existing = recipe.aiSummary;
      if (existing) return existing;
      const summary = recipe.steps
        .slice(0, 2)
        .map((s) => s.text)
        .join(" ")
        .slice(0, 400);
      if (ctx.recipeContent.supportsRecipeMutations()) {
        await ctx.prisma.recipe.update({
          where: { id: args.recipeId },
          data: { aiSummary: summary },
        });
      }
      return summary;
    },
  },

  Recipe: {
    ingredients(parent: { ingredients?: unknown[] }) {
      return parent.ingredients ?? [];
    },
    steps(parent: { steps?: unknown[] }) {
      return parent.steps ?? [];
    },
    tags(parent: { tags?: Array<{ tag: unknown }> }) {
      return (parent.tags ?? []).map((t) => t.tag);
    },
    reviewStats(
      parent: { __reviewStats?: ReviewStats; slug: string },
      _: unknown,
      ctx: GraphQLContext
    ) {
      if (parent.__reviewStats !== undefined) {
        return parent.__reviewStats;
      }
      return loadReviewStatsForSlug(ctx.prisma, parent.slug);
    },
    async reviews(
      parent: { slug: string },
      args: { first?: number | null },
      ctx: GraphQLContext
    ) {
      const first = Math.min(args.first ?? 50, 100);
      const rows = await ctx.prisma.recipeReview.findMany({
        where: { recipeSlug: parent.slug },
        orderBy: { createdAt: "desc" },
        take: first,
      });
      return rows.map((r) => ({
        id: r.id,
        rating: r.rating,
        body: r.body,
        authorName: r.authorName,
        createdAt: r.createdAt,
        mine: r.sessionKey === ctx.sessionKey,
      }));
    },
  },

  IngredientLine: {
    amountDisplay(parent: { amount: number; unit: string }) {
      return formatQuantity(parent.amount, parent.unit);
    },
  },
};

/** Remove contributions that match merged line by recomputing: delete raw lines until merged amount removed — simplified: delete all raw for session and re-insert minus one merged line's worth. */
async function removeMergedLine(
  ctx: GraphQLContext,
  raw: Array<{
    id: string;
    foodName: string;
    unit: string;
    amount: number;
    note: string | null;
  }>,
  target: { foodName: string; unit: string; amount: number }
) {
  const key = (f: string, u: string) =>
    `${f.trim().toLowerCase()}||${u.trim().toLowerCase()}`;
  const tk = key(target.foodName, target.unit);
  let remaining = target.amount;
  const toDelete: string[] = [];
  for (const line of raw) {
    if (remaining <= 0) break;
    if (key(line.foodName, line.unit) !== tk) continue;
    if (line.amount <= remaining + 1e-9) {
      remaining -= line.amount;
      toDelete.push(line.id);
    } else {
      await ctx.prisma.groceryLine.update({
        where: { id: line.id },
        data: { amount: line.amount - remaining },
      });
      remaining = 0;
    }
  }
  if (toDelete.length) {
    await ctx.prisma.groceryLine.deleteMany({
      where: { id: { in: toDelete } },
    });
  }
}
