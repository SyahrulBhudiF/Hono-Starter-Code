export type Paging = {
	page: number;
	size: number;
	totalItems: number;
	totalPages: number;
};

export type SuccessResponse<TData> = {
	status: number;
	message: string;
	data: TData;
	paging?: Paging;
};

export type ErrorDetail = {
	message: string;
};

export type ErrorResponse = {
	status: number;
	message: string | ErrorDetail[];
	data: null;
};

export const ResponseUtil = {
	success<TData>(
		data: TData,
		message = "Success",
		options: { status?: number; paging?: Paging } = {},
	): SuccessResponse<TData> {
		const body: SuccessResponse<TData> = {
			status: options.status ?? 200,
			message,
			data,
		};

		if (options.paging) {
			body.paging = options.paging;
		}

		return body;
	},

	error(message: string | ErrorDetail[], status = 500): ErrorResponse {
		return {
			status,
			message,
			data: null,
		};
	},
};
