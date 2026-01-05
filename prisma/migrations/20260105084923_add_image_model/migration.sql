-- CreateTable
CREATE TABLE "public"."Image" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "publicId" TEXT NOT NULL,
    "originalSize" INTEGER NOT NULL,
    "compressedSize" INTEGER,
    "format" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "processType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);
