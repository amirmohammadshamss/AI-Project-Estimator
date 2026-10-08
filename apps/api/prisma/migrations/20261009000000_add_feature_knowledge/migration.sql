CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE "FeatureKnowledge" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "typicalHours" DOUBLE PRECISION NOT NULL CHECK ("typicalHours" > 0),
  "complexity" TEXT NOT NULL CHECK ("complexity" IN ('LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH')),
  "embeddingModel" TEXT NOT NULL,
  "embedding" vector(1536) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FeatureKnowledge_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FeatureKnowledge_name_embeddingModel_key" ON "FeatureKnowledge"("name", "embeddingModel");
