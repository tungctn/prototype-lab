import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePrototypeTables1782545827343 implements MigrationInterface {
  name = 'CreatePrototypeTables1782545827343';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TABLE "chat_messages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "session_id" uuid NOT NULL, "role" character varying(20) NOT NULL, "content" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_40c55ee0e571e268b0d3cd37d10" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0672782561e44d43febcfba298" ON "chat_messages" ("session_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "prototype_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "session_id" uuid NOT NULL, "kind" character varying(20) NOT NULL, "title" character varying(255) NOT NULL, "status" character varying(40) NOT NULL DEFAULT 'saved', "route_slug" character varying(255) NOT NULL, "route_path" character varying(255) NOT NULL, "url" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6058fbf50783f105345fbca5295" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b2a47984cd0ce057f97fbed988" ON "prototype_items" ("session_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "chat_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workspace_id" uuid NOT NULL, "title" character varying(255) NOT NULL, "status" character varying(40) NOT NULL DEFAULT 'session_created', "route_slug" character varying(255) NOT NULL, "route_path" character varying(255) NOT NULL, "prototype_dir" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_efc151a4aafa9a28b73dedc485f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1f621bc2ae7adb3fbd75750016" ON "chat_sessions" ("workspace_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cafb4a38d06497617ec9f67654" ON "chat_sessions" ("route_slug") `,
    );
    await queryRunner.query(
      `CREATE TABLE "workspaces" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "repo_name" character varying(255) NOT NULL, "repo_url" text, "prototype_root" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_098656ae401f3e1a4586f47fd8e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_messages" ADD CONSTRAINT "FK_0672782561e44d43febcfba2984" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "prototype_items" ADD CONSTRAINT "FK_b2a47984cd0ce057f97fbed9888" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_sessions" ADD CONSTRAINT "FK_1f621bc2ae7adb3fbd75750016e" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chat_sessions" DROP CONSTRAINT "FK_1f621bc2ae7adb3fbd75750016e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "prototype_items" DROP CONSTRAINT "FK_b2a47984cd0ce057f97fbed9888"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_messages" DROP CONSTRAINT "FK_0672782561e44d43febcfba2984"`,
    );
    await queryRunner.query(`DROP TABLE "workspaces"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_cafb4a38d06497617ec9f67654"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1f621bc2ae7adb3fbd75750016"`,
    );
    await queryRunner.query(`DROP TABLE "chat_sessions"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b2a47984cd0ce057f97fbed988"`,
    );
    await queryRunner.query(`DROP TABLE "prototype_items"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0672782561e44d43febcfba298"`,
    );
    await queryRunner.query(`DROP TABLE "chat_messages"`);
  }
}
