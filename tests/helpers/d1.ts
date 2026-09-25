import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
export function testDatabase() {
  const sqlite = new DatabaseSync(':memory:');
  let failAfter = 0;
  class Statement {
    args: SQLInputValue[] = [];
    sql: string;
    constructor(sql: string) {
      this.sql = sql;
    }
    bind(...args: SQLInputValue[]) {
      this.args = args;
      return this;
    }
    async first() {
      return sqlite.prepare(this.sql).get(...this.args) || null;
    }
    async all() {
      return { results: sqlite.prepare(this.sql).all(...this.args) };
    }
    runSync() {
      return {
        meta: {
          changes: Number(sqlite.prepare(this.sql).run(...this.args).changes),
        },
      };
    }
    async run() {
      return this.runSync();
    }
  }
  const db = {
    prepare: (sql: string) => new Statement(sql),
    async batch(statements: Statement[]) {
      sqlite.exec('BEGIN');
      const fault = failAfter;
      failAfter = 0;
      try {
        const result = statements.map((s, index) => {
          const value = s.runSync();
          if (fault === index + 1) throw Error('Injected transaction failure');
          return value;
        });
        sqlite.exec('COMMIT');
        return result;
      } catch (e) {
        sqlite.exec('ROLLBACK');
        throw e;
      }
    },
  } as unknown as D1Database;
  return {
    db,
    sqlite,
    failNextBatchAfter: (count: number) => {
      failAfter = count;
    },
  };
}
