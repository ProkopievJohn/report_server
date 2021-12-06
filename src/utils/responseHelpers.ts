import { ParameterizedContext } from 'koa'

export type ResponseBodyType = {
	code: number,
	data: Record<string, unknown>,
	success: boolean,
}

export const badRequest = (ctx: ParameterizedContext<unknown>, data: { message: string, [key: string]: unknown }): void => {
	ctx.response.status = 400
	ctx.response.body = {
		code: 400,
		data,
		success: false,
	}
}

export const notFound = (ctx: ParameterizedContext<unknown>, data: { message: string, [key: string]: unknown }): void => {
	ctx.response.status = 404
	ctx.response.body = {
		code: 404,
		data,
		success: false,
	}
}

export const dataConflict = (ctx: ParameterizedContext<unknown>, data: { message: string, [key: string]: unknown }): void => {
	ctx.response.status = 409
	ctx.response.body = {
		code: 409,
		data,
		success: false,
	}
}

export const resolve = (ctx: ParameterizedContext<unknown>, data: Record<string, unknown>): void => {
	ctx.response.status = 200
	ctx.response.body = {
		code: 200,
		data,
		success: true,
	}
}

export const unauthorized = (ctx: ParameterizedContext<unknown>): void => {
	ctx.response.status = 401
	ctx.response.body = {
		code: 401,
		data: {
			message: 'You must be logged in for this function!',
		},
		success: false,
	}
}

export const forbidden = (ctx: ParameterizedContext<unknown>, data: { message: string, [key: string]: unknown }): void => {
	ctx.response.status = 403
	ctx.response.body = {
		code: 403,
		data,
		success: false,
	}
}

export const reject = (
	ctx: ParameterizedContext<unknown>,
	data: {
		message: string,
		status: number,
	},
): void => {
	ctx.response.status = data.status
	ctx.response.body = {
		success: false,
		code: data.status,
		data: {
			message: data.message,
		},
	}
}