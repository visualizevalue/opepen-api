import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  public async up() {

    await this.db.rawQuery(`
      UPDATE "curated_tweets"
      SET "media_urls" =
        CASE
          WHEN "media_url" IS NOT NULL AND "media_url" <> '' 
          THEN to_jsonb(ARRAY[json_build_object('url', "media_url")])
          ELSE '[]'::jsonb
        END;
    `);

    await this.db.rawQuery(`
      ALTER TABLE "curated_tweets"
      DROP COLUMN IF EXISTS "media_url";
    `);
  }

  public async down() {
    await this.db.rawQuery(`
      ALTER TABLE "curated_tweets"
      ADD COLUMN IF NOT EXISTS "media_url" varchar(255) NULL;
    `);

    await this.db.rawQuery(`
      UPDATE "curated_tweets"
      SET "media_url" = COALESCE((media_urls->0->>'url'), NULL);
    `);
  }
}
