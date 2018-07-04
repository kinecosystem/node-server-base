import * as express from "express";
import "express-async-errors";  // handle async/await errors in middleware

import { getConfig } from "./config";
import { initLogger } from "./logging";
import { init as initCustomMiddleware, notFoundHandler, generalErrorHandler } from "./middleware";

const config = getConfig();
const logger = initLogger(...config.loggers!);

function createApp(): express.Express {
	const app = express();
	app.set("port", config.port);

	const bodyParser = require("body-parser");
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: false }));

	const cookieParser = require("cookie-parser");
	app.use(cookieParser());

	initCustomMiddleware(app);

	return app;
}

export const app = createApp();

// routes
// TODO: add app routes

// catch 404
app.use(notFoundHandler);
// catch errors
app.use(generalErrorHandler);

export async function init() {
	// TODO: add initialization logic, the index.ts will await it
}
