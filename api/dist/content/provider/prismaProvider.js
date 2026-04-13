const recipeInclude = {
    ingredients: { orderBy: { sortOrder: "asc" } },
    steps: { orderBy: { sortOrder: "asc" } },
    tags: { include: { tag: true } },
};
function asNode(row) {
    return row;
}
export class PrismaRecipeContentProvider {
    prisma;
    source = "db";
    constructor(prisma) {
        this.prisma = prisma;
    }
    supportsRecipeMutations() {
        return true;
    }
    async findFirst(args) {
        if (!args.id && !args.slug)
            return null;
        const row = await this.prisma.recipe.findFirst({
            where: args.id ? { id: args.id } : { slug: args.slug },
            include: recipeInclude,
        });
        return row ? asNode(row) : null;
    }
    async findRecipesConnection(args) {
        const filter = args.filter;
        const where = {};
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
        const rows = after != null && after !== ""
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
    async findRecipeMetaByIds(ids) {
        if (ids.length === 0)
            return [];
        return this.prisma.recipe.findMany({
            where: { id: { in: ids } },
            select: { id: true, title: true, slug: true },
        });
    }
    async findForGrocery(recipeId) {
        const recipe = await this.prisma.recipe.findUnique({
            where: { id: recipeId },
            include: { ingredients: true },
        });
        if (!recipe)
            return null;
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
    async findTitle(recipeId) {
        const r = await this.prisma.recipe.findUnique({
            where: { id: recipeId },
            select: { title: true },
        });
        return r;
    }
    async findForSummarize(recipeId) {
        const recipe = await this.prisma.recipe.findUnique({
            where: { id: recipeId },
            include: { steps: { orderBy: { sortOrder: "asc" } } },
        });
        if (!recipe)
            return null;
        return {
            aiSummary: recipe.aiSummary,
            steps: recipe.steps.map((s) => ({ text: s.text })),
        };
    }
}
//# sourceMappingURL=prismaProvider.js.map