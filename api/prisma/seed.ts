import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TAGS = [
  { name: "Breakfast", slug: "breakfast" },
  { name: "Lunch", slug: "lunch" },
  { name: "Dinner", slug: "dinner" },
  { name: "Dessert", slug: "dessert" },
  { name: "Snack", slug: "snack" },
  { name: "Vegetarian", slug: "vegetarian" },
  { name: "Quick", slug: "quick" },
  { name: "Baking", slug: "baking" },
] as const;

type SeedIngredient = {
  section?: string;
  foodName: string;
  unit: string;
  amount: number;
  note?: string;
};

type SeedRecipe = {
  slug: string;
  title: string;
  /** If false, recipe stays a draft (good for admin UI testing). */
  published: boolean;
  tagSlugs: string[];
  steps: string[];
  ingredients: SeedIngredient[];
};

const RECIPES: SeedRecipe[] = [
  {
    slug: "sample-pasta",
    title: "Sample pasta",
    published: true,
    tagSlugs: ["dinner", "quick"],
    steps: [
      "Wash produce if serving with fresh herbs or vegetables.",
      "Bring a large pot of salted water to a boil.",
      "Cook pasta until al dente. Drain and toss with sauce.",
    ],
    ingredients: [
      { section: "Pasta", foodName: "penne", unit: "lb", amount: 1 },
      {
        section: "Pasta",
        foodName: "kosher salt",
        unit: "tsp",
        amount: 1.5,
        note: "for water",
      },
      { section: "Sauce", foodName: "olive oil", unit: "tbsp", amount: 2 },
    ],
  },
  {
    slug: "sunday-buttermilk-pancakes",
    title: "Sunday buttermilk pancakes",
    published: true,
    tagSlugs: ["breakfast", "baking"],
    steps: [
      "Preheat a griddle or large skillet over medium heat.",
      "Whisk dry ingredients in one bowl; whisk wet in another.",
      "Combine until just mixed; small lumps are fine.",
      "Butter the griddle and cook ¼ cup scoops until bubbles form, then flip.",
    ],
    ingredients: [
      { foodName: "all-purpose flour", unit: "cup", amount: 2 },
      { foodName: "baking powder", unit: "tsp", amount: 2 },
      { foodName: "granulated sugar", unit: "tbsp", amount: 2 },
      { foodName: "salt", unit: "tsp", amount: 0.5 },
      { foodName: "buttermilk", unit: "cup", amount: 2 },
      { foodName: "eggs", unit: "whole", amount: 2 },
      { foodName: "unsalted butter", unit: "tbsp", amount: 4, note: "melted" },
    ],
  },
  {
    slug: "classic-chocolate-chip-cookies",
    title: "Classic chocolate chip cookies",
    published: true,
    tagSlugs: ["dessert", "baking", "snack"],
    steps: [
      "Preheat oven to 375°F. Line baking sheets with parchment.",
      "Cream softened butter with sugars until light.",
      "Beat in eggs and vanilla, then fold in flour mixture and chocolate chips.",
      "Scoop dough, bake 9–11 minutes until golden at edges.",
    ],
    ingredients: [
      { foodName: "unsalted butter", unit: "cup", amount: 1 },
      { foodName: "brown sugar", unit: "cup", amount: 0.75 },
      { foodName: "granulated sugar", unit: "cup", amount: 0.5 },
      { foodName: "eggs", unit: "whole", amount: 2 },
      { foodName: "vanilla extract", unit: "tsp", amount: 2 },
      { foodName: "all-purpose flour", unit: "cup", amount: 2.25 },
      { foodName: "baking soda", unit: "tsp", amount: 1 },
      { foodName: "salt", unit: "tsp", amount: 1 },
      { foodName: "semi-sweet chocolate chips", unit: "cup", amount: 2 },
    ],
  },
  {
    slug: "tangy-lemon-bars",
    title: "Tangy lemon bars",
    published: true,
    tagSlugs: ["dessert", "baking"],
    steps: [
      "Preheat oven to 350°F.",
      "Press shortbread crust into pan and bake until lightly golden.",
      "Whisk lemon filling, pour over crust, bake until set.",
      "Cool completely before slicing; dust with powdered sugar if desired.",
    ],
    ingredients: [
      { section: "Crust", foodName: "unsalted butter", unit: "cup", amount: 1 },
      { section: "Crust", foodName: "granulated sugar", unit: "cup", amount: 0.5 },
      { section: "Crust", foodName: "all-purpose flour", unit: "cup", amount: 2 },
      { section: "Crust", foodName: "salt", unit: "tsp", amount: 0.25 },
      {
        section: "Filling",
        foodName: "lemons",
        unit: "whole",
        amount: 4,
        note: "zest and juice",
      },
      { section: "Filling", foodName: "granulated sugar", unit: "cup", amount: 1.5 },
      { section: "Filling", foodName: "eggs", unit: "whole", amount: 4 },
      { section: "Filling", foodName: "all-purpose flour", unit: "tbsp", amount: 3 },
    ],
  },
  {
    slug: "garden-salad-lemon-vinaigrette",
    title: "Garden salad with lemon vinaigrette",
    published: true,
    tagSlugs: ["lunch", "vegetarian", "quick"],
    steps: [
      "Wash and dry greens; tear or chop as you like.",
      "Whisk olive oil, lemon juice, mustard, salt, and pepper.",
      "Toss greens with dressing just before serving; top with vegetables.",
    ],
    ingredients: [
      { foodName: "mixed salad greens", unit: "oz", amount: 8 },
      { foodName: "cucumber", unit: "whole", amount: 1 },
      { foodName: "cherry tomatoes", unit: "cup", amount: 1 },
      { foodName: "red onion", unit: "cup", amount: 0.25, note: "thinly sliced" },
      { foodName: "olive oil", unit: "tbsp", amount: 3 },
      { foodName: "lemon juice", unit: "tbsp", amount: 2 },
      { foodName: "Dijon mustard", unit: "tsp", amount: 1 },
    ],
  },
  {
    slug: "weeknight-beef-tacos",
    title: "Weeknight beef tacos",
    published: true,
    tagSlugs: ["dinner", "quick"],
    steps: [
      "Dice onion and mince garlic.",
      "Brown ground beef; drain excess fat if needed.",
      "Add spices and a splash of water; simmer until thickened.",
      "Warm tortillas and serve with toppings.",
    ],
    ingredients: [
      { foodName: "ground beef", unit: "lb", amount: 1 },
      { foodName: "yellow onion", unit: "whole", amount: 1 },
      { foodName: "garlic", unit: "clove", amount: 3 },
      { foodName: "chili powder", unit: "tbsp", amount: 1 },
      { foodName: "cumin", unit: "tsp", amount: 1 },
      { foodName: "corn tortillas", unit: "whole", amount: 12 },
      { foodName: "cheddar cheese", unit: "cup", amount: 1, note: "shredded" },
    ],
  },
  {
    slug: "smoky-three-bean-chili",
    title: "Smoky three-bean chili",
    published: true,
    tagSlugs: ["dinner", "vegetarian", "quick"],
    steps: [
      "Sauté onion and bell pepper until softened.",
      "Add garlic and spices; cook 1 minute.",
      "Stir in beans, tomatoes, and broth; simmer 25–30 minutes.",
      "Adjust salt; serve with lime and cilantro.",
    ],
    ingredients: [
      { foodName: "yellow onion", unit: "whole", amount: 1 },
      { foodName: "red bell pepper", unit: "whole", amount: 1 },
      { foodName: "garlic", unit: "clove", amount: 4 },
      { foodName: "olive oil", unit: "tbsp", amount: 2 },
      {
        foodName: "canned diced tomatoes",
        unit: "can",
        amount: 2,
        note: "14 oz each",
      },
      { foodName: "black beans", unit: "can", amount: 1, note: "drained" },
      { foodName: "kidney beans", unit: "can", amount: 1, note: "drained" },
      { foodName: "pinto beans", unit: "can", amount: 1, note: "drained" },
      { foodName: "vegetable broth", unit: "cup", amount: 2 },
      { foodName: "chili powder", unit: "tbsp", amount: 2 },
      { foodName: "cumin", unit: "tsp", amount: 2 },
    ],
  },
  {
    slug: "herb-roast-chicken-thighs",
    title: "Herb roast chicken thighs",
    published: true,
    tagSlugs: ["dinner"],
    steps: [
      "Preheat oven to 425°F.",
      "Pat chicken dry; rub with olive oil, herbs, salt, and pepper.",
      "Roast on a sheet pan until skin is crisp and internal temp is 165°F.",
      "Rest 5 minutes before serving.",
    ],
    ingredients: [
      { foodName: "chicken thighs", unit: "lb", amount: 2.5, note: "bone-in" },
      { foodName: "olive oil", unit: "tbsp", amount: 2 },
      { foodName: "garlic", unit: "clove", amount: 4 },
      { foodName: "fresh rosemary", unit: "tbsp", amount: 1, note: "chopped" },
      { foodName: "fresh thyme", unit: "tsp", amount: 2 },
      { foodName: "lemon", unit: "whole", amount: 1, note: "halved" },
    ],
  },
  {
    slug: "peanut-butter-banana-smoothie",
    title: "Peanut butter banana smoothie",
    published: true,
    tagSlugs: ["breakfast", "snack", "quick", "vegetarian"],
    steps: [
      "Peel banana and add to blender with milk, peanut butter, and honey.",
      "Add ice; blend until smooth.",
      "Taste and adjust sweetness or thickness.",
    ],
    ingredients: [
      { foodName: "banana", unit: "whole", amount: 2, note: "frozen or fresh" },
      { foodName: "milk", unit: "cup", amount: 1.5 },
      { foodName: "peanut butter", unit: "tbsp", amount: 2 },
      { foodName: "honey", unit: "tsp", amount: 2 },
      { foodName: "ice", unit: "cup", amount: 1 },
    ],
  },
  {
    slug: "overnight-oats-berries",
    title: "Overnight oats with berries",
    published: true,
    tagSlugs: ["breakfast", "vegetarian", "quick"],
    steps: [
      "Combine oats, milk, yogurt, and chia in a jar.",
      "Stir in maple syrup; seal and refrigerate overnight.",
      "Top with berries before eating.",
    ],
    ingredients: [
      { foodName: "rolled oats", unit: "cup", amount: 0.5 },
      { foodName: "milk", unit: "cup", amount: 0.5 },
      { foodName: "Greek yogurt", unit: "cup", amount: 0.25 },
      { foodName: "chia seeds", unit: "tbsp", amount: 1 },
      { foodName: "maple syrup", unit: "tbsp", amount: 1 },
      { foodName: "mixed berries", unit: "cup", amount: 0.5 },
    ],
  },
  {
    slug: "draft-citrus-herb-marinade",
    title: "Citrus herb marinade (draft)",
    published: false,
    tagSlugs: ["quick"],
    steps: [
      "Zest and juice the orange and lemon.",
      "Whisk with olive oil, minced garlic, and chopped herbs.",
      "Marinate chicken or pork 2–8 hours before cooking.",
    ],
    ingredients: [
      { foodName: "olive oil", unit: "cup", amount: 0.5 },
      { foodName: "orange", unit: "whole", amount: 1 },
      { foodName: "lemon", unit: "whole", amount: 1 },
      { foodName: "garlic", unit: "clove", amount: 3 },
      { foodName: "fresh parsley", unit: "cup", amount: 0.25, note: "chopped" },
      { foodName: "salt", unit: "tsp", amount: 1 },
    ],
  },
  {
    slug: "draft-mushroom-risotto",
    title: "Creamy mushroom risotto (draft)",
    published: false,
    tagSlugs: ["dinner", "vegetarian"],
    steps: [
      "Warm broth in a saucepan; keep at a simmer.",
      "Sauté mushrooms until golden; set aside.",
      "Toast rice in butter; add wine, then ladle broth gradually while stirring.",
      "Fold in mushrooms and Parmesan; serve immediately.",
    ],
    ingredients: [
      { foodName: "Arborio rice", unit: "cup", amount: 1.5 },
      { foodName: "vegetable broth", unit: "cup", amount: 5 },
      { foodName: "cremini mushrooms", unit: "oz", amount: 8 },
      { foodName: "unsalted butter", unit: "tbsp", amount: 3 },
      { foodName: "dry white wine", unit: "cup", amount: 0.5 },
      { foodName: "Parmesan cheese", unit: "cup", amount: 0.5, note: "grated" },
      { foodName: "yellow onion", unit: "whole", amount: 0.5, note: "diced" },
    ],
  },
];

async function main() {
  const tagBySlug = new Map<string, string>();

  for (const t of TAGS) {
    const row = await prisma.tag.upsert({
      where: { slug: t.slug },
      create: { name: t.name, slug: t.slug },
      update: { name: t.name },
    });
    tagBySlug.set(t.slug, row.id);
  }

  let created = 0;
  let skipped = 0;

  for (const r of RECIPES) {
    const exists = await prisma.recipe.findUnique({ where: { slug: r.slug } });
    if (exists) {
      skipped++;
      continue;
    }

    const tagConnections = r.tagSlugs
      .map((slug) => tagBySlug.get(slug))
      .filter((id): id is string => Boolean(id));

    await prisma.recipe.create({
      data: {
        title: r.title,
        slug: r.slug,
        publishedAt: r.published ? new Date() : null,
        tags: {
          create: tagConnections.map((tagId) => ({
            tag: { connect: { id: tagId } },
          })),
        },
        steps: {
          create: r.steps.map((text, sortOrder) => ({ sortOrder, text })),
        },
        ingredients: {
          create: r.ingredients.map((ing, sortOrder) => ({
            sortOrder,
            section: ing.section ?? undefined,
            foodName: ing.foodName,
            unit: ing.unit,
            amount: ing.amount,
            note: ing.note ?? undefined,
          })),
        },
      },
    });
    created++;
    console.log(`Seeded recipe: ${r.slug}`);
  }

  console.log(
    `Seed done. Created ${created} recipe(s), skipped ${skipped} existing slug(s). Tags: ${TAGS.length}.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
