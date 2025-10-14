import { type SQL, type SQLWrapper, sql, eq } from "drizzle-orm";

interface SelectOptions {
	columns?: string[];
	where?: SQLWrapper;
	orderBy?: SQL;
	limit?: number;
	offset?: number;
}

export class Repository<TEntity extends Record<string, any>> {
	constructor(
		private db: any,
		private table: any,
	) {}

	async create(entity: Partial<TEntity>): Promise<TEntity> {
		const result: any = await this.db
			.insert(this.table)
			.values(entity)
			.returning();
		return result[0] as TEntity;
	}

	async update(
		identifier: string,
		identifierColumn: keyof TEntity,
		entity: Partial<TEntity>,
	): Promise<TEntity> {
		const result = await this.db
			.update(this.table)
			.set(entity)
			.where(eq(this.table[identifierColumn], identifier))
			.returning();
		return result[0] as TEntity;
	}

	async delete(id: string): Promise<void> {
		await this.db.delete(this.table).where(eq(this.table.id, id));
	}

	async findById(
		id: string,
		options?: Omit<SelectOptions, "where">,
	): Promise<TEntity | null> {
		let query = this.db.select();

		if (options?.columns?.length) {
			query = this.db.select(
				options.columns.reduce((acc: any, col) => {
					acc[col] = this.table[col];
					return acc;
				}, {}),
			);
		} else {
			query = this.db.select();
		}

		const result = await query
			.from(this.table)
			.where(eq(this.table.id, id))
			.limit(1);

		return (result[0] as TEntity) || null;
	}

	async findAll(options?: SelectOptions): Promise<TEntity[]> {
		let query = this.db.select();

		if (options?.columns?.length) {
			query = this.db.select(
				options.columns.reduce((acc: any, col) => {
					acc[col] = this.table[col];
					return acc;
				}, {}),
			);
		}

		query = query.from(this.table);

		if (options?.where) {
			query = query.where(options.where);
		}

		if (options?.orderBy) {
			query = query.orderBy(options.orderBy);
		}

		if (options?.limit) {
			query = query.limit(options.limit);
		}

		if (options?.offset) {
			query = query.offset(options.offset);
		}

		return query as Promise<TEntity[]>;
	}

	async findByColumn(
		column: keyof typeof this.table,
		value: any,
		options?: Omit<SelectOptions, "where">,
	): Promise<TEntity[]> {
		let query = this.db.select();

		if (options?.columns?.length) {
			query = this.db.select(
				options.columns.reduce((acc: any, col) => {
					acc[col] = this.table[col];
					return acc;
				}, {}),
			);
		}

		query = query.from(this.table).where(eq(this.table[column], value));

		if (options?.orderBy) {
			query = query.orderBy(options.orderBy);
		}

		if (options?.limit) {
			query = query.limit(options.limit);
		}

		if (options?.offset) {
			query = query.offset(options.offset);
		}

		return query as Promise<TEntity[]>;
	}

	async count(where?: SQLWrapper): Promise<number> {
		const result = await this.db
			.select({
				count: sql<number>`count(*)`,
			})
			})
			.from(this.table)
			.where(where || undefined);

		return Number(result[0].count);
	}

	async transaction<T>(
		fn: (repo: Repository<TEntity>) => Promise<T>,
	): Promise<T> {
		return await this.db.transaction(async (tx: any) => {
			const repo = new Repository<TEntity>(tx, this.table);
			return await fn(repo);
		});
	}
}
