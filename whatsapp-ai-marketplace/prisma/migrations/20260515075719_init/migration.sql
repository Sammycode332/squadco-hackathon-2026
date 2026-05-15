-- CreateEnum
CREATE TYPE "OnboardingStage" AS ENUM ('NEW', 'LANGUAGE_SELECTED', 'ASKING_TRADE', 'ASKING_LOCATION', 'ASKING_GOAL', 'COMPLETE');

-- CreateEnum
CREATE TYPE "UserIntent" AS ENUM ('TRADER', 'JOB_SEEKER', 'BUSINESS_GROWTH', 'UNKNOWN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "displayName" TEXT,
    "language" TEXT,
    "trade" TEXT,
    "location" TEXT,
    "intent" "UserIntent" NOT NULL DEFAULT 'UNKNOWN',
    "state" TEXT NOT NULL DEFAULT 'NEW_USER',
    "onboardingStage" "OnboardingStage" NOT NULL DEFAULT 'NEW',
    "wantsJobs" BOOLEAN NOT NULL DEFAULT false,
    "wantsBusinessHelp" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "whatsappId" TEXT,
    "userId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "messageType" TEXT NOT NULL,
    "body" TEXT,
    "mediaUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Message_whatsappId_key" ON "Message"("whatsappId");

-- CreateIndex
CREATE INDEX "Message_userId_createdAt_idx" ON "Message"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
