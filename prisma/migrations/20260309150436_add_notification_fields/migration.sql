-- AlterTable
ALTER TABLE `notifications` ADD COLUMN `actionUrl` VARCHAR(191) NULL,
    ADD COLUMN `category` VARCHAR(191) NULL DEFAULT 'system';
