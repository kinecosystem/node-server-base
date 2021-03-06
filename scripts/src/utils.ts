import * as _path from "path";

const fromProjectRoot = _path.join.bind(path, __dirname, "../../");

export type SimpleObject<T = any> = { [key: string]: T };

export function isSimpleObject(obj: any): obj is SimpleObject {
	return typeof obj === "object" && !Array.isArray(obj);
}

export type Nothing = null | undefined;

export function isNothing(obj: any): obj is Nothing {
	return obj === null || obj === undefined;
}

export function path(path: string): string {
	if (path.startsWith("/")) {
		return path;
	}
	return fromProjectRoot(path);
}

export function random(): number;
export function random(min: number, max: number): number;

export function random<T = any>(arr: T[]): T;
export function random<T = any>(map: Map<string, T>): [string, T];
export function random<T = any>(obj: SimpleObject<T>): [string, T];

export function random(first?: number | Map<string, any> | SimpleObject | any[], second?: number): number | [string, any] | any {
	if (first instanceof Map) {
		first = Array.from(first.entries());
	} else if (isSimpleObject(first)) {
		first = Object.keys(first).map(key => [key, (first as SimpleObject)[key]]);
	}

	if (Array.isArray(first)) {
		return first[Math.floor(Math.random() * first.length)];
	}

	if (first !== undefined && second !== undefined) {
		return Math.random() * (second - (first as number)) + (first as number);
	}

	return Math.random();
}

// return a random number between min (including) and max (excluding) i.e. min <= rand() < max
export function randomInteger(min: number, max: number): number {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min;
}

const ID_LENGTH = 20;
const ID_CHARS = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function generateId(prefix: string = ""): string {
	let id = "";

	while (id.length < ID_LENGTH) {
		id += ID_CHARS[randomInteger(0, ID_CHARS.length)];
	}

	return prefix + id;
}

export function normalizeError(error: string | Error | any): string {
	if (isNothing(error)) {
		return "";
	}

	if (typeof error === "string") {
		return error;
	}

	if (error instanceof Error) {
		return error.message;
	}

	return error.toString();
}

export function delay(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export function pick<T, K extends keyof T>(obj: T, ...props: K[]): Pick<T, K> {
	const newObj = {} as Pick<T, K>;
	props.forEach(name => newObj[name] = obj[name]);
	return newObj;
}

export function assign<T>(target: Partial<T>, ...sources: Array<Partial<T>>) {
	return Object.assign(target, ...sources.map(x =>
		Object.entries(x)
			.filter(([key, value]) => value !== undefined)
			.reduce((obj, [key, value]) => ((obj as any)[key] = value, obj), {})
	));
}
