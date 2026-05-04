-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "keyName" TEXT NOT NULL,
    "encryptedApiKey" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "authTag" TEXT NOT NULL,
    "baseUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "ProviderKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiAgent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "providerKeyId" TEXT,
    "roleTitle" TEXT,
    "backgroundInfo" TEXT,
    "persona" TEXT,
    "speakingStyle" TEXT,
    "systemPrompt" TEXT,
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.6,
    "maxTokens" INTEGER NOT NULL DEFAULT 1200,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionSpace" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "goal" TEXT,
    "mode" TEXT NOT NULL,
    "maxRounds" INTEGER NOT NULL DEFAULT 4,
    "autoSummary" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscussionSpace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpaceMember" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "seatOrder" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpaceMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionMessage" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "senderType" TEXT NOT NULL,
    "senderAgentId" TEXT,
    "content" TEXT NOT NULL,
    "roundIndex" INTEGER NOT NULL DEFAULT 0,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscussionMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscussionRun" (
    "id" TEXT NOT NULL,
    "spaceId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "currentRound" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT,
    "actionItemsJson" JSONB,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscussionRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "spaceId" TEXT,
    "agentId" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "costEstimate" DECIMAL(10,6),
    "latencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "ProviderKey_userId_idx" ON "ProviderKey"("userId");

-- CreateIndex
CREATE INDEX "AiAgent_userId_idx" ON "AiAgent"("userId");

-- CreateIndex
CREATE INDEX "AiAgent_providerKeyId_idx" ON "AiAgent"("providerKeyId");

-- CreateIndex
CREATE INDEX "DiscussionSpace_userId_idx" ON "DiscussionSpace"("userId");

-- CreateIndex
CREATE INDEX "SpaceMember_agentId_idx" ON "SpaceMember"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "SpaceMember_spaceId_agentId_key" ON "SpaceMember"("spaceId", "agentId");

-- CreateIndex
CREATE INDEX "DiscussionMessage_spaceId_createdAt_idx" ON "DiscussionMessage"("spaceId", "createdAt");

-- CreateIndex
CREATE INDEX "DiscussionMessage_senderAgentId_idx" ON "DiscussionMessage"("senderAgentId");

-- CreateIndex
CREATE INDEX "DiscussionRun_spaceId_idx" ON "DiscussionRun"("spaceId");

-- CreateIndex
CREATE INDEX "UsageLog_userId_createdAt_idx" ON "UsageLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UsageLog_spaceId_idx" ON "UsageLog"("spaceId");

-- CreateIndex
CREATE INDEX "UsageLog_agentId_idx" ON "UsageLog"("agentId");

-- AddForeignKey
ALTER TABLE "ProviderKey" ADD CONSTRAINT "ProviderKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiAgent" ADD CONSTRAINT "AiAgent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiAgent" ADD CONSTRAINT "AiAgent_providerKeyId_fkey" FOREIGN KEY ("providerKeyId") REFERENCES "ProviderKey"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionSpace" ADD CONSTRAINT "DiscussionSpace_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceMember" ADD CONSTRAINT "SpaceMember_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "DiscussionSpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceMember" ADD CONSTRAINT "SpaceMember_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AiAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionMessage" ADD CONSTRAINT "DiscussionMessage_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "DiscussionSpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionMessage" ADD CONSTRAINT "DiscussionMessage_senderAgentId_fkey" FOREIGN KEY ("senderAgentId") REFERENCES "AiAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscussionRun" ADD CONSTRAINT "DiscussionRun_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "DiscussionSpace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageLog" ADD CONSTRAINT "UsageLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageLog" ADD CONSTRAINT "UsageLog_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "DiscussionSpace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageLog" ADD CONSTRAINT "UsageLog_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AiAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
