import { path, assign } from "./utils";
import { LogTarget } from "./logging";

let config: Config;

export interface Config {
	host: string;

	port?: number;
	app_name?: string;
	loggers?: LogTarget[];
}

export function init(filePath: string) {
	if (config) {
		return;
	}

	config = assign({}, require(path(filePath!)), {
		host: process.env.APP_HOST,
		app_name: process.env.APP_NAME,
		port: process.env.APP_PORT ? parseInt(process.env.APP_PORT, 10) : undefined,
	});
}

export function getConfig() {
	return config;
}
