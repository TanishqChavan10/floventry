import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompanyBarcodeSettings20260216 implements MigrationInterface {
  name = 'AddCompanyBarcodeSettings20260216';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "companies"
        ADD COLUMN IF NOT EXISTS "barcode_prefix" VARCHAR(20) NOT NULL DEFAULT 'FLO-',
        ADD COLUMN IF NOT EXISTS "barcode_padding" INT NOT NULL DEFAULT 6,
        ADD COLUMN IF NOT EXISTS "barcode_next_number" BIGINT NOT NULL DEFAULT 1,
        ADD COLUMN IF NOT EXISTS "barcode_suffix" VARCHAR(20) NOT NULL DEFAULT '';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "companies"
        DROP COLUMN IF EXISTS "barcode_suffix",
        DROP COLUMN IF EXISTS "barcode_next_number",
        DROP COLUMN IF EXISTS "barcode_padding",
        DROP COLUMN IF EXISTS "barcode_prefix";
    `);
  }
}
