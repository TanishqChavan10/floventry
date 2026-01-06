import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOrderAndIssueNumbers1704531600000 implements MigrationInterface {
    name = 'AddOrderAndIssueNumbers1704531600000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add order_number column to sales_orders
        await queryRunner.query(`
            ALTER TABLE "sales_orders" 
            ADD COLUMN "order_number" VARCHAR(50)
        `);

        // Add issue_number column to issue_notes
        await queryRunner.query(`
            ALTER TABLE "issue_notes" 
            ADD COLUMN "issue_number" VARCHAR(50)
        `);

        // Backfill existing sales orders with sequential numbers
        await queryRunner.query(`
            WITH numbered_orders AS (
                SELECT 
                    id,
                    company_id,
                    'SO-' || LPAD(ROW_NUMBER() OVER (PARTITION BY company_id ORDER BY created_at)::TEXT, 5, '0') as new_order_number
                FROM sales_orders
                WHERE order_number IS NULL
            )
            UPDATE sales_orders so
            SET order_number = no.new_order_number
            FROM numbered_orders no
            WHERE so.id = no.id
        `);

        // Backfill existing issue notes with sequential numbers
        await queryRunner.query(`
            WITH numbered_issues AS (
                SELECT 
                    id,
                    warehouse_id,
                    'ISS-' || LPAD(ROW_NUMBER() OVER (PARTITION BY warehouse_id ORDER BY created_at)::TEXT, 5, '0') as new_issue_number
                FROM issue_notes
                WHERE issue_number IS NULL
            )
            UPDATE issue_notes inn
            SET issue_number = ni.new_issue_number
            FROM numbered_issues ni
            WHERE inn.id = ni.id
        `);

        // Add unique constraints after backfill
        await queryRunner.query(`
            ALTER TABLE "sales_orders" 
            ADD CONSTRAINT "UQ_sales_orders_order_number" UNIQUE ("order_number")
        `);

        await queryRunner.query(`
            ALTER TABLE "issue_notes" 
            ADD CONSTRAINT "UQ_issue_notes_issue_number" UNIQUE ("issue_number")
        `);

        // Make columns NOT NULL after backfill
        await queryRunner.query(`
            ALTER TABLE "sales_orders" 
            ALTER COLUMN "order_number" SET NOT NULL
        `);

        await queryRunner.query(`
            ALTER TABLE "issue_notes" 
            ALTER COLUMN "issue_number" SET NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove constraints first
        await queryRunner.query(`
            ALTER TABLE "issue_notes" 
            DROP CONSTRAINT "UQ_issue_notes_issue_number"
        `);

        await queryRunner.query(`
            ALTER TABLE "sales_orders" 
            DROP CONSTRAINT "UQ_sales_orders_order_number"
        `);

        // Drop columns
        await queryRunner.query(`
            ALTER TABLE "issue_notes" 
            DROP COLUMN "issue_number"
        `);

        await queryRunner.query(`
            ALTER TABLE "sales_orders" 
            DROP COLUMN "order_number"
        `);
    }
}
