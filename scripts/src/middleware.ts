import * as express from "express";
import { LoggerInstance } from "winston";
import { Request, Response } from "express-serve-static-core";

import { generateId } from "./utils";
import { ClientError } from "./errors";
import { getDefaultLogger } from "./logging";

let logger: LoggerInstance;

export function init(app: express.Express) {
	logger = getDefaultLogger();

	app.use(requestLogger);
	app.use(logRequest);
}

declare module "express" {
	interface Request {
		readonly id: string;
		readonly logger: LoggerInstance;
	}
}

/**
 * augments the request object with a request-id and a logger.
 * the logger should be then used when logging inside request handlers, which will then add some more info per log
 */
export const requestLogger = function(req: express.Request, res: express.Response, next: express.NextFunction) {
	const methods = ["debug", "info", "warn", "error"];
	const id = generateId();
	const proxy = new Proxy(logger, {
		get(target, name: keyof LoggerInstance) {
			if (typeof name === "string" && methods.includes(name)) {
				return function(...args: any[]) {
					if (typeof args[args.length - 1] === "object") {
						args[args.length - 1] = Object.assign({}, args[args.length - 1], { reqId: id });
					} else {
						args = [...args, { reqId: id }];
					}

					(target[name] as (...args: any[]) => void)(...args);
				};
			}

			return target[name];
		}
	});

	// id & logger are readonly and so cannot be assigned, unless cast to any
	(req as any).id = id;
	(req as any).logger = proxy;
	next();
} as express.RequestHandler;

export const logRequest = function(req: express.Request, res: express.Response, next: express.NextFunction) {
	const t = performance.now();
	const data = Object.assign({}, req.headers);

	if (req.query && Object.keys(req.query).length > 0) {
		data.querystring = req.query;
	}

	req.logger.info(`start handling request ${ req.id }: ${ req.method } ${ req.path }`, data);

	res.on("finish", () => {
		req.logger.info(`finished handling request ${ req.id }`, { time: performance.now() - t });
	});

	next();
} as express.RequestHandler;

export const notFoundHandler = function(req: Request, res: Response) {
	res.status(404).send({ code: 404, error: "Not found", message: "Not found" });
} as express.RequestHandler;

/**
 * The "next" arg is needed even though it's not used, otherwise express won't understand that it's an error handler
 */
export function generalErrorHandler(err: any, req: Request, res: Response, next: express.NextFunction) {
	if (err instanceof ClientError) {
		clientErrorHandler(err, req as express.Request, res);
	} else {
		serverErrorHandler(err, req as express.Request, res);
	}
}

function clientErrorHandler(error: ClientError, req: express.Request, res: express.Response) {
	const log = req.logger || logger;

	log.error(`client error (4xx)`, error);
	// set headers from the error if any
	Object.keys(error.headers).forEach(key => res.setHeader(key, error.headers[key]));
	res.status(error.status).send(error.toJson());
}

function serverErrorHandler(error: any, req: express.Request, res: express.Response) {
	const log = req.logger || logger;

	let message = `Error
	method: ${ req.method }
	path: ${ req.url }
	payload: ${ JSON.stringify(req.body) }
	`;

	if (error instanceof Error) {
		message += `message: ${ error.message }
	stack: ${ error.stack }`;
	} else {
		message += `message: ${ error.toString() }`;
	}

	log.error(`server error (5xx)`, message);

	res.status(500).send({ code: 500, error: error.message || "Server error", message: error.message });
}
