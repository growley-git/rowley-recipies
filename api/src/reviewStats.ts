import type { PrismaClient } from "@prisma/client";

export type ReviewStats = {
  averageRating: number | null;
  reviewCount: number;
};

export async function loadReviewStatsMap(
  prisma: PrismaClient,
  recipeSlugs: string[]
): Promise<Map<string, ReviewStats>> {
  const map = new Map<string, ReviewStats>();
  if (recipeSlugs.length === 0) return map;
  const unique = [...new Set(recipeSlugs)];
  for (const slug of unique) {
    map.set(slug, { averageRating: null, reviewCount: 0 });
  }
  const rows = await prisma.recipeReview.groupBy({
    by: ["recipeSlug"],
    where: { recipeSlug: { in: unique } },
    _avg: { rating: true },
    _count: { _all: true },
  });
  for (const row of rows) {
    const avg = row._avg.rating;
    map.set(row.recipeSlug, {
      averageRating:
        avg != null ? Math.round(Number(avg) * 100) / 100 : null,
      reviewCount: row._count._all,
    });
  }
  return map;
}

export async function loadReviewStatsForSlug(
  prisma: PrismaClient,
  recipeSlug: string
): Promise<ReviewStats> {
  const map = await loadReviewStatsMap(prisma, [recipeSlug]);
  return map.get(recipeSlug) ?? { averageRating: null, reviewCount: 0 };
}
