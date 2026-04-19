import { execSync } from "node:child_process";

function run(command) {
  execSync(command, {
    stdio: "inherit",
    env: process.env
  });
}

function getEnvironmentName() {
  return process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development";
}

function requireEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function main() {
  const environmentName = getEnvironmentName();

  run("npx prisma generate");

  if (environmentName === "production") {
    requireEnv("DATABASE_URL");
    run("npx prisma db push");
  } else {
    console.log(
      `[vercel-build] Skipping prisma db push for ${environmentName} environment.`
    );
  }

  run("next build");
}

main();
