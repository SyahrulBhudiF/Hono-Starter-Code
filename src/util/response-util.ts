export class ResponseUtil {
	/*
	 * This method is used to return a success response
	 * @param data: TEntity | null
	 * @param message: string
	 * @return object
	 *
	 * using with c.json in Hono
	 * */
	static success<TEntity>(
		data: TEntity | null,
		message: string = "Success",
		paging: any = undefined,
	): object {
		return {
			status: "success",
			message,
			data,
			paging,
		};
	}

	/*
	 * This method is used to return an error response
	 * @param message: any
	 * @param status: any
	 * @return object
	 *
	 * using with c.json in Hono
	 * */
	static error(message: any, status: any = "error"): object {
		return {
			status,
			message,
			data: null,
		};
	}
}
