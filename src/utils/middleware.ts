import { ParameterizedContext, Next } from 'koa'
import { forbidden, reject, unauthorized } from './responseHelpers'
import { ObjectId } from 'mongodb'
import { CaughtError } from './helpers'
import { EUserRoles } from '../constants'
import { IUser, UserCollection } from '../models/user'

export function isAuthenticated(ctx: ParameterizedContext, next: Next): Promise<void> | void {
	try {
		if (ctx.state && ctx.state.user && typeof ctx.state.user._id === 'string' && typeof ctx.state.user.companyId === 'string') {
			ctx.state.user = {
				...ctx.state.user,
				_id: new ObjectId(ctx.state.user._id),
				companyId: new ObjectId(ctx.state.user.companyId),
			}
			return next()
		} else {
			return unauthorized(ctx)
		}
	} catch (err) {
		return unauthorized(ctx)
	}
}

export function hasRole(role: EUserRoles) {
	return async (ctx: ParameterizedContext, next: Next): Promise<void> => {
		try {
			const user: IUser = await UserCollection.findOne({ _id: ctx.state.user._id })
			if (user && user.role <= role) {
				return next()
			} else {
				return forbidden(ctx, { message: 'You do not have access to this function!' })
			}
		} catch (err) {
			throw new CaughtError('Cannot check user role!', err)
		}
	}
}

export async function errorHandler(ctx: ParameterizedContext, next: Next): Promise<void> {
	try {
		await next()
	} catch (err) {
		if (err && err.status === 401) {
			return unauthorized(ctx)
		}
		if (err instanceof CaughtError) {

			// eslint-disable-next-line no-console
			console.error('[ERROR]', err)

			return reject(ctx, {
				message: err.message,
				status: err.code || 400,
			})
		} else {
			// eslint-disable-next-line no-console
			console.error('[ERROR]', err)

			return reject(ctx, {
				message: 'Something went wrong!',
				status: 500,
			})
		}
	}
}
