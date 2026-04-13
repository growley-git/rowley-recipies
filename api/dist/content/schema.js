import { ContentParseError } from "./errors.js";
function isRecord(v) {
    return typeof v === "object" && v !== null && !Array.isArray(v);
}
export function validateFrontmatter(raw, filePath) {
    if (!raw.title?.trim()) {
        return new ContentParseError("Frontmatter must include `title`", filePath);
    }
    if (!raw.slug?.trim()) {
        return new ContentParseError("Frontmatter must include `slug`", filePath);
    }
    let publishedAt = null;
    if (raw.publishedAt?.trim()) {
        const d = new Date(raw.publishedAt);
        if (Number.isNaN(d.getTime())) {
            return new ContentParseError(`Invalid publishedAt: ${raw.publishedAt}`, filePath);
        }
        publishedAt = d;
    }
    else if (raw.published === true) {
        publishedAt = new Date();
    }
    const tags = Array.isArray(raw.tags)
        ? raw.tags.filter((t) => typeof t === "string" && t.trim().length > 0)
        : [];
    const ingredientsIn = Array.isArray(raw.ingredients) ? raw.ingredients : [];
    const ingredients = [];
    for (let i = 0; i < ingredientsIn.length; i++) {
        const ing = ingredientsIn[i];
        if (!isRecord(ing)) {
            return new ContentParseError(`ingredients[${i}] must be an object`, filePath);
        }
        const foodName = ing.foodName;
        const unit = ing.unit;
        const amount = ing.amount;
        if (typeof foodName !== "string" || !foodName.trim()) {
            return new ContentParseError(`ingredients[${i}].foodName required`, filePath);
        }
        if (typeof unit !== "string" || !unit.trim()) {
            return new ContentParseError(`ingredients[${i}].unit required`, filePath);
        }
        if (typeof amount !== "number" || !Number.isFinite(amount)) {
            return new ContentParseError(`ingredients[${i}].amount must be a number`, filePath);
        }
        ingredients.push({
            foodName: foodName.trim(),
            unit: unit.trim(),
            amount,
            section: typeof ing.section === "string" && ing.section.trim()
                ? ing.section.trim()
                : null,
            note: typeof ing.note === "string" && ing.note.trim()
                ? ing.note.trim()
                : null,
        });
    }
    return {
        id: typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : undefined,
        title: raw.title.trim(),
        slug: raw.slug.trim(),
        publishedAt,
        tags,
        ingredients,
        summary: typeof raw.summary === "string" && raw.summary.trim()
            ? raw.summary.trim()
            : null,
    };
}
//# sourceMappingURL=schema.js.map