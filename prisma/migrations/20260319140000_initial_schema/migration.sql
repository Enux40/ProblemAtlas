-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('SAAS', 'INTERNAL_TOOL', 'MARKETPLACE', 'AUTOMATION', 'ANALYTICS', 'DEVELOPER_TOOL', 'MOBILE_APP', 'SERVICE_BUSINESS_TOOL');

-- CreateEnum
CREATE TYPE "MonetizationType" AS ENUM ('SUBSCRIPTION', 'ONE_TIME_LICENSE', 'USAGE_BASED', 'LEAD_GEN', 'AGENCY_UPSELL', 'TRANSACTION_FEE');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('INTERVIEW', 'FORUM', 'JOB_POSTING', 'REVIEW_SITE', 'SEARCH_TREND', 'MARKET_REPORT', 'SUPPORT_TICKET', 'SOCIAL_POST');

-- CreateEnum
CREATE TYPE "ProblemStatus" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BuildTimeUnit" AS ENUM ('DAYS', 'WEEKS', 'MONTHS');

-- CreateTable
CREATE TABLE "Problem" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "targetUser" TEXT NOT NULL,
    "painPoint" TEXT NOT NULL,
    "suggestedMvp" TEXT NOT NULL,
    "demandSignalsSummary" TEXT NOT NULL,
    "riskNotes" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "industry" TEXT,
    "geographyFocus" TEXT,
    "companySize" TEXT,
    "recommendedSkill" "SkillLevel" NOT NULL,
    "projectTypes" "ProjectType"[],
    "monetizationTypes" "MonetizationType"[],
    "status" "ProblemStatus" NOT NULL DEFAULT 'DRAFT',
    "buildTimeValue" INTEGER NOT NULL,
    "buildTimeUnit" "BuildTimeUnit" NOT NULL,
    "difficultyScore" INTEGER NOT NULL,
    "demandScore" INTEGER NOT NULL,
    "monetizationScore" INTEGER NOT NULL,
    "validationScore" INTEGER NOT NULL,
    "editorialScore" INTEGER NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Problem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemEvidence" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "sourceType" "SourceType" NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "snippet" TEXT,
    "signalStrength" INTEGER NOT NULL,
    "capturedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProblemEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemTag" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProblemTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemStack" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProblemStack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminNote" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT true,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsletterSignup" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT,
    "source" TEXT,
    "interests" TEXT[],
    "confirmedAt" TIMESTAMP(3),
    "unsubscribedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterSignup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProblemToProblemTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProblemToProblemTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ProblemToProblemStack" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProblemToProblemStack_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Problem_slug_key" ON "Problem"("slug");

-- CreateIndex
CREATE INDEX "Problem_status_featured_idx" ON "Problem"("status", "featured");

-- CreateIndex
CREATE INDEX "Problem_category_recommendedSkill_idx" ON "Problem"("category", "recommendedSkill");

-- CreateIndex
CREATE INDEX "Problem_slug_status_idx" ON "Problem"("slug", "status");

-- CreateIndex
CREATE INDEX "ProblemEvidence_problemId_sourceType_idx" ON "ProblemEvidence"("problemId", "sourceType");

-- CreateIndex
CREATE UNIQUE INDEX "ProblemTag_slug_key" ON "ProblemTag"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProblemTag_name_key" ON "ProblemTag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProblemStack_slug_key" ON "ProblemStack"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProblemStack_name_key" ON "ProblemStack"("name");

-- CreateIndex
CREATE INDEX "AdminNote_problemId_pinned_idx" ON "AdminNote"("problemId", "pinned");

-- CreateIndex
CREATE UNIQUE INDEX "NewsletterSignup_email_key" ON "NewsletterSignup"("email");

-- CreateIndex
CREATE INDEX "NewsletterSignup_createdAt_idx" ON "NewsletterSignup"("createdAt");

-- CreateIndex
CREATE INDEX "_ProblemToProblemTag_B_index" ON "_ProblemToProblemTag"("B");

-- CreateIndex
CREATE INDEX "_ProblemToProblemStack_B_index" ON "_ProblemToProblemStack"("B");

-- AddForeignKey
ALTER TABLE "ProblemEvidence" ADD CONSTRAINT "ProblemEvidence_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminNote" ADD CONSTRAINT "AdminNote_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProblemToProblemTag" ADD CONSTRAINT "_ProblemToProblemTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProblemToProblemTag" ADD CONSTRAINT "_ProblemToProblemTag_B_fkey" FOREIGN KEY ("B") REFERENCES "ProblemTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProblemToProblemStack" ADD CONSTRAINT "_ProblemToProblemStack_A_fkey" FOREIGN KEY ("A") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProblemToProblemStack" ADD CONSTRAINT "_ProblemToProblemStack_B_fkey" FOREIGN KEY ("B") REFERENCES "ProblemStack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

