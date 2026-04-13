/** Meal tags must exist on seeded recipes (breakfast / lunch / dinner). */
export const MEAL_SLOTS = [
  { label: "Breakfast", slug: "breakfast" },
  { label: "Lunch", slug: "lunch" },
  { label: "Dinner", slug: "dinner" },
] as const;

export type ProteinOption = {
  label: string;
  /** Match ingredient `foodName` (case-insensitive). */
  matchers: RegExp[];
};

export const PROTEINS: ProteinOption[] = [
  {
    label: "Chicken",
    matchers: [/chicken/i, /poultry/i, /thigh/i, /breast/i, /drumstick/i],
  },
  {
    label: "Beef",
    matchers: [/beef/i, /steak/i, /brisket/i, /ground beef/i],
  },
  {
    label: "Pork",
    matchers: [/pork/i, /bacon/i, /sausage/i, /ham/i, /prosciutto/i],
  },
  {
    label: "Fish",
    matchers: [/fish/i, /salmon/i, /tuna/i, /cod/i, /tilapia/i, /seafood/i],
  },
  {
    label: "Eggs",
    matchers: [/egg/i],
  },
  {
    label: "Beans",
    matchers: [/bean/i, /lentil/i, /chickpea/i, /black bean/i, /kidney bean/i],
  },
  {
    label: "Tofu",
    matchers: [/tofu/i, /tempeh/i, /seitan/i],
  },
  {
    label: "Turkey",
    matchers: [/turkey/i],
  },
  {
    label: "Cheese",
    matchers: [/cheese/i, /parmesan/i, /cheddar/i, /mozzarella/i, /feta/i],
  },
];

export type ArchiveRecipe = {
  id: string;
  title: string;
  slug: string;
  tags: { slug: string }[];
  ingredients: { foodName: string }[];
};

export function recipeHasMealTag(recipe: ArchiveRecipe, mealSlug: string): boolean {
  return recipe.tags.some((t) => t.slug === mealSlug);
}

export function recipeMatchesProtein(
  recipe: ArchiveRecipe,
  protein: ProteinOption
): boolean {
  return recipe.ingredients.some((ing) =>
    protein.matchers.some((re) => re.test(ing.foodName))
  );
}

export function pickRecipeForSpin(
  archive: ArchiveRecipe[],
  mealSlug: string,
  protein: ProteinOption
): { recipe: ArchiveRecipe; improvised: boolean } {
  const forMeal = archive.filter((r) => recipeHasMealTag(r, mealSlug));
  if (forMeal.length === 0) {
    const anyPublished = archive.filter((r) => r.tags.length > 0);
    const pool = anyPublished.length ? anyPublished : archive;
    const recipe = pool[Math.floor(Math.random() * pool.length)];
    return { recipe, improvised: true };
  }
  const withProtein = forMeal.filter((r) => recipeMatchesProtein(r, protein));
  if (withProtein.length > 0) {
    const recipe =
      withProtein[Math.floor(Math.random() * withProtein.length)]!;
    return { recipe, improvised: false };
  }
  const recipe = forMeal[Math.floor(Math.random() * forMeal.length)]!;
  return { recipe, improvised: true };
}
