-- CreateTable
CREATE TABLE "Compra" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "descripcion" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "total" REAL NOT NULL,
    "base" REAL NOT NULL,
    "iva" REAL NOT NULL,
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL
);
