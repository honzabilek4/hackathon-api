/*
  Warnings:

  - Added the required column `name` to the `Session` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceLang" TEXT NOT NULL,
    "targetLang" TEXT NOT NULL,
    "name" TEXT NOT NULL
);
INSERT INTO "new_Session" ("id", "sourceLang", "targetLang") SELECT "id", "sourceLang", "targetLang" FROM "Session";
DROP TABLE "Session";
ALTER TABLE "new_Session" RENAME TO "Session";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
