-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transcript" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "original" TEXT NOT NULL,
    "translated" TEXT NOT NULL
);
INSERT INTO "new_Transcript" ("id", "original", "timestamp", "translated") SELECT "id", "original", "timestamp", "translated" FROM "Transcript";
DROP TABLE "Transcript";
ALTER TABLE "new_Transcript" RENAME TO "Transcript";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
