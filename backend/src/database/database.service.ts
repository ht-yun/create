import { Inject, Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Pool, type PoolClient, type QueryResultRow } from "pg";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor(@Inject(ConfigService) private readonly config: ConfigService) {
    this.pool = new Pool({
      connectionString: this.config.getOrThrow<string>("DATABASE_URL"),
      max: 10,
      idleTimeoutMillis: 30_000,
    });
  }

  async migrate() {
    if (this.config.get("AUTO_MIGRATE", "true") !== "true") return;
    const sql = await readFile(resolve(process.cwd(), "src/database/schema.sql"), "utf8");
    await this.pool.query(sql);
  }

  query<T extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []) {
    return this.pool.query<T>(text, values);
  }

  async transaction<T>(work: (client: PoolClient) => Promise<T>) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await work(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async ping() {
    const result = await this.pool.query<{ now: Date }>("SELECT now() AS now");
    return result.rows[0].now;
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
