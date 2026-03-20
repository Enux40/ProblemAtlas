/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("node:path");
const { PrismaClient } = require("@prisma/client");
const { importCuratedContent, loadContentFile } = require("./content-seeding");

function getUsage() {
  return [
    "Usage:",
    "  node prisma/import-problems.js <json-file> [--reset] [--validate-only]",
    "",
    "Examples:",
    "  node prisma/import-problems.js prisma/examples/problem-import.example.json --validate-only",
    "  node prisma/import-problems.js prisma/examples/problem-import.example.json",
  ].join("\n");
}

async function main() {
  const args = process.argv.slice(2);
  const fileArg = args.find((arg) => !arg.startsWith("--"));

  if (!fileArg) {
    console.error(getUsage());
    process.exit(1);
  }

  const absolutePath = path.resolve(fileArg);
  const reset = args.includes("--reset");
  const validateOnly = args.includes("--validate-only");
  const content = await loadContentFile(absolutePath);

  if (validateOnly) {
    console.log(
      `Validated ${content.problems.length} problem(s), ${content.tags.length} tag(s), ${content.stacks.length} stack(s), and ${content.newsletterSignups.length} newsletter signup(s) from ${absolutePath}.`
    );
    return;
  }

  const prisma = new PrismaClient();

  try {
    const summary = await importCuratedContent(prisma, content, { reset });
    console.log(
      `Imported ${summary.problems} problem(s), ${summary.tags} tag(s), ${summary.stacks} stack(s), and ${summary.newsletterSignups} newsletter signup(s) from ${absolutePath}.`
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
