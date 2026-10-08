ALTER TABLE "Estimate" ADD COLUMN "projectName" TEXT, ADD COLUMN "projectDescription" TEXT;
UPDATE "Estimate" AS estimate SET "projectName" = project.name, "projectDescription" = project.description FROM "Project" AS project WHERE estimate."projectId" = project.id;
ALTER TABLE "Estimate" ALTER COLUMN "projectName" SET NOT NULL, ALTER COLUMN "projectDescription" SET NOT NULL;
