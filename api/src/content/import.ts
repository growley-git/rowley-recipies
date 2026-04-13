import type { PrismaClient } from "@prisma/client";
import { createId } from "@paralleldrive/cuid2";
import { parseRecipeFile } from "./parse.js";
import { listRecipeMarkdownFiles } from "./list.js";
import { getContentRecipesDir } from "./config.js";
import { slugify } from "../slug.js";

export type ImportResult = {
  imported: number;
  warnings: string[];
};

/**
 * Upsert recipes from Markdown files into Prisma (flat-file → DB sync).
 * Idempotent on `slug`. Preserves existing `id` when updating by slug so grocery links stay valid.
 */
export async function runContentImport(
  prisma: PrismaClient,
  options?: { dir?: string; verbose?: boolean }
): Promise<ImportResult> {
  const dir = options?.dir ?? getContentRecipesDir();
  const verbose = options?.verbose ?? false;
  const paths = await listRecipeMarkdownFiles(dir);
  const warnings: string[] = [];
  let imported = 0;

  for (const filePath of paths) {
    const parsed = await parseRecipeFile(filePath);
    const fm = parsed.frontmatter;
    if (!fm.id && verbose) {
      warnings.push(
        `${filePath}: no \`id\` in frontmatter; generated id will be used on create`
      );
    }

    const existing = await prisma.recipe.findUnique({
      where: { slug: fm.slug },
    });
    const recipeId = existing?.id ?? fm.id ?? createId();

    if (fm.id && existing && existing.id !== fm.id) {
      warnings.push(
        `${filePath}: frontmatter id ${fm.id} differs from DB id ${existing.id} for slug ${fm.slug}; keeping DB id for stability`
      );
    }

    await prisma.recipe.upsert({
      where: { slug: fm.slug },
      create: {
        id: recipeId,
        title: fm.title,
        slug: fm.slug,
        publishedAt: fm.publishedAt,
        aiSummary: fm.summary,
      },
      update: {
        title: fm.title,
        publishedAt: fm.publishedAt,
        aiSummary: fm.summary,
      },
    });

    const recipeRow = await prisma.recipe.findUnique({
      where: { slug: fm.slug },
    });
    if (!recipeRow) {
      warnings.push(`${filePath}: upsert failed unexpectedly`);
      continue;
    }
    const rid = recipeRow.id;

    await prisma.ingredientLine.deleteMany({ where: { recipeId: rid } });
    await prisma.recipeStep.deleteMany({ where: { recipeId: rid } });
    await prisma.recipeTag.deleteMany({ where: { recipeId: rid } });

    await prisma.recipe.update({
      where: { id: rid },
      data: {
        ingredients: {
          create: fm.ingredients.map((ing, i) => ({
            sortOrder: i,
            section: ing.section ?? undefined,
            foodName: ing.foodName,
            unit: ing.unit,
            amount: ing.amount,
            note: ing.note ?? undefined,
          })),
        },
        steps: {
          create: parsed.steps.map((text, i) => ({
            sortOrder: i,
            text,
          })),
        },
      },
    });

    const tagConnections: { tagId: string }[] = [];
    for (const name of fm.tags) {
      const slug = slugify(name);
      const tag = await prisma.tag.upsert({
        where: { slug },
        create: { name: name.trim(), slug },
        update: { name: name.trim() },
      });
      tagConnections.push({ tagId: tag.id });
    }

    if (tagConnections.length) {
      await prisma.recipe.update({
        where: { id: rid },
        data: {
          tags: {
            create: tagConnections.map((t) => ({
              tag: { connect: { id: t.tagId } },
            })),
          },
        },
      });
    }

    imported += 1;
  }

  return { imported, warnings };
}
