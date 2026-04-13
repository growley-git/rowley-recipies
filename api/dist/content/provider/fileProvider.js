import fs from "node:fs/promises";
import { parseRecipeFileSource } from "../parse.js";
import { listRecipeMarkdownFiles } from "../list.js";
import { contentHotReload, getContentRecipesDir } from "../config.js";
import { slugify } from "../../slug.js";
function toGraphQLNode(p) {
    const fm = p.frontmatter;
    const id = fm.id ?? `recipe-${fm.slug}`;
    return {
        id,
        title: fm.title,
        slug: fm.slug,
        publishedAt: fm.publishedAt,
        aiSummary: fm.summary,
        ingredients: fm.ingredients.map((ing, i) => ({
            id: `${id}-ing-${i}`,
            sortOrder: i,
            section: ing.section ?? null,
            foodName: ing.foodName,
            unit: ing.unit,
            amount: ing.amount,
            note: ing.note ?? null,
        })),
        steps: p.steps.map((text, i) => ({
            id: `${id}-step-${i}`,
            sortOrder: i,
            text,
        })),
        tags: fm.tags.map((name) => {
            const slug = slugify(name);
            return {
                tag: {
                    id: `tag-${slug}`,
                    name: name.trim(),
                    slug,
                },
            };
        }),
    };
}
function matchesFilter(node, filter) {
    if (filter.publishedOnly && !node.publishedAt) {
        return false;
    }
    if (filter.tagSlug) {
        const ok = node.tags.some((t) => t.tag.slug === filter.tagSlug);
        if (!ok)
            return false;
    }
    if (filter.search?.trim()) {
        const q = filter.search.trim().toLowerCase();
        const inTitle = node.title.toLowerCase().includes(q);
        const inIng = node.ingredients.some((i) => i.foodName.toLowerCase().includes(q));
        const inSteps = node.steps.some((s) => s.text.toLowerCase().includes(q));
        if (!inTitle && !inIng && !inSteps)
            return false;
    }
    return true;
}
export class FileRecipeContentProvider {
    recipesDir;
    source = "files";
    cache = null;
    constructor(recipesDir = getContentRecipesDir()) {
        this.recipesDir = recipesDir;
    }
    supportsRecipeMutations() {
        return false;
    }
    async loadAll() {
        if (this.cache && !contentHotReload()) {
            return this.cache;
        }
        const paths = await listRecipeMarkdownFiles(this.recipesDir);
        const nodes = [];
        for (const p of paths) {
            const raw = await fs.readFile(p, "utf8");
            const parsed = parseRecipeFileSource(raw, p);
            nodes.push(toGraphQLNode(parsed));
        }
        const sorted = nodes.sort((a, b) => (a.id < b.id ? 1 : a.id > b.id ? -1 : 0));
        this.cache = sorted;
        return sorted;
    }
    async findFirst(args) {
        const all = await this.loadAll();
        if (args.id) {
            return all.find((r) => r.id === args.id) ?? null;
        }
        if (args.slug) {
            return all.find((r) => r.slug === args.slug) ?? null;
        }
        return null;
    }
    async findRecipesConnection(args) {
        const all = await this.loadAll();
        const filtered = all
            .filter((n) => matchesFilter(n, args.filter))
            .sort((a, b) => (a.id < b.id ? 1 : a.id > b.id ? -1 : 0));
        const totalCount = filtered.length;
        let start = 0;
        if (args.after) {
            const idx = filtered.findIndex((r) => r.id === args.after);
            start = idx >= 0 ? idx + 1 : 0;
        }
        const slice = filtered.slice(start, start + args.first + 1);
        const hasNextPage = slice.length > args.first;
        const nodes = hasNextPage ? slice.slice(0, args.first) : slice;
        const edges = nodes.map((node) => ({ cursor: node.id, node }));
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
        const all = await this.loadAll();
        const map = new Map();
        for (const r of all) {
            for (const { tag } of r.tags) {
                if (!map.has(tag.slug)) {
                    map.set(tag.slug, { id: tag.id, name: tag.name, slug: tag.slug });
                }
            }
        }
        return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    }
    async findRecipeMetaByIds(ids) {
        if (ids.length === 0)
            return [];
        const all = await this.loadAll();
        const set = new Set(ids);
        return all
            .filter((r) => set.has(r.id))
            .map((r) => ({ id: r.id, title: r.title, slug: r.slug }));
    }
    async findForGrocery(recipeId) {
        const r = await this.findFirst({ id: recipeId });
        if (!r)
            return null;
        return {
            id: r.id,
            publishedAt: r.publishedAt,
            ingredients: r.ingredients.map((i) => ({
                foodName: i.foodName,
                unit: i.unit,
                amount: i.amount,
                note: i.note,
            })),
        };
    }
    async findTitle(recipeId) {
        const r = await this.findFirst({ id: recipeId });
        return r ? { title: r.title } : null;
    }
    async findForSummarize(recipeId) {
        const r = await this.findFirst({ id: recipeId });
        if (!r)
            return null;
        return {
            aiSummary: r.aiSummary,
            steps: r.steps.map((s) => ({ text: s.text })),
        };
    }
}
//# sourceMappingURL=fileProvider.js.map