import {createRoute, OpenAPIHono} from "@hono/zod-openapi";
import {z, ZodType} from "zod";

export const createRouteUtil = (method: "post" | "get" | "put" | "patch" | "delete", path: string, requestSchema: ZodType, responseSchema: ZodType) => {
    return createRoute({
        method,
        path,
        request: {
            body: {
                content: {
                    "application/json": {
                        schema: requestSchema,
                    },
                },
            },
        },
        responses: {
            200: {
                description: "Success",
                content: {
                    "application/json": {
                        schema: responseSchema,
                    },
                },
            },
            400: {
                description: "Bad Request",
                content: {
                    "application/json": {
                        schema: z.object({
                            status: z.string(),
                            message: z.string(),
                            data: z.null(),
                        }),
                        example: {
                            status: "error",
                            message: "Invalid request data",
                            data: null,
                        },
                    },
                },
            },
            401: {
                description: "Unauthorized",
                content: {
                    "application/json": {
                        schema: z.object({
                            status: z.string(),
                            message: z.string(),
                            data: z.null(),
                        }),
                        example: {
                            status: "error",
                            message: "Unauthorized access",
                            data: null,
                        },
                    },
                },
            },
            403: {
                description: "Forbidden",
                content: {
                    "application/json": {
                        schema: z.object({
                            status: z.string(),
                            message: z.string(),
                            data: z.null(),
                        }),
                        example: {
                            status: "error",
                            message: "Access forbidden",
                            data: null,
                        },
                    },
                },
            },
            404: {
                description: "Not Found",
                content: {
                    "application/json": {
                        schema: z.object({
                            status: z.string(),
                            message: z.string(),
                            data: z.null(),
                        }),
                        example: {
                            status: "error",
                            message: "Resource not found",
                            data: null,
                        },
                    },
                },
            },
            500: {
                description: "Internal Server Error",
                content: {
                    "application/json": {
                        schema: z.object({
                            status: z.string(),
                            message: z.string(),
                            data: z.null(),
                        }),
                        example: {
                            status: "error",
                            message: "Internal server error",
                            data: null,
                        },
                    },
                },
            },
        },
    });
}

export class RouteCollector {
    private static routes = new Set<string>()

    static collect(app: OpenAPIHono) {
        const routePatterns = app.routes.map(route => ({
            method: route.method,
            path: route.path,
        }))

        routePatterns.forEach(({method, path}) => {
            this.routes.add(`${method} ${path}`)
        })
    }

    static getRoutes() {
        return Array.from(this.routes).sort()
    }
}