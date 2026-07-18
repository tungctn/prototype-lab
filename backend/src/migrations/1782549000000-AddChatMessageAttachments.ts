import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChatMessageAttachments1782549000000 implements MigrationInterface {
  name = 'AddChatMessageAttachments1782549000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chat_messages" ADD "attachments" jsonb NOT NULL DEFAULT '[]'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chat_messages" DROP COLUMN "attachments"`,
    );
  }
}
