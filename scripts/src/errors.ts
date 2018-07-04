export type ApiError = {
	code: number;
	error: string;
	message: string;
};

export type HeaderValue = number | string | string[];

export class ClientError extends Error {
	public readonly title: string;
	public readonly status: number; // http status code
	public readonly code: number; // our own internal codes
	public readonly headers: { [name: string]: HeaderValue };

	constructor(status: number, index: number, title: string, message: string) {
		super(message);
		this.code = Number(status + "" + index);
		this.title = title;
		this.status = status;
		this.headers = {};
	}

	public setHeader(name: string, value: HeaderValue) {
		this.headers[name] = value;
	}

	public toJson(): ApiError {
		return {
			code: this.code,
			error: this.title,
			message: this.message
		};
	}

	public toString(): string {
		return JSON.stringify(this.toJson());
	}
}
