import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { runContentImport } from "../content/import.js";
import { getContentRecipesDir } from "../content/config.js";

const verbose = process.argv.includes("--verbose");

async function main() {
  const prisma = new PrismaClient();
  try {
    const dir = getContentRecipesDir();
    console.log(`Importing recipes from: ${dir}`);
    const { imported, warnings } = await runContentImport(prisma, {
      dir,
      verbose,
    });
    console.log(`Imported/updated ${imported} recipe(s).`);
    for (const w of warnings) {
      console.warn("warn:", w);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
