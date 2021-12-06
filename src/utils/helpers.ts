import jsonwebtoken from 'jsonwebtoken'
import { IUser } from '../models/user'
import config from '../../config'

export function generateAccessToken(user: IUser): string {
	const rawToken = {
		_id: user._id,
		companyId: user.companyId,
	}

	return jsonwebtoken.sign(
		rawToken,
		config.jwt.secret,
		config.jwt.options,
	)
}

export function generateWrongJwt(): string {
	const token: string = jsonwebtoken.sign(
		{},
		config.jwt.secret,
		config.jwt.options,
	)
	return 'Bearer ' + token
}

interface CaughtErrorArgs {
	code?: number
	[key: string]: unknown
}

export class CaughtError extends Error {
	name: string
	message: string
	error: string | Record<string, unknown> | null
	systemErrors: string | Record<string, unknown> | null
	code: number

	constructor(
		message = 'Something went wrong!',
		data?: CaughtErrorArgs,
		rest?: Record<string, unknown>
	) {
		super()
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, CaughtError)
		}

		const { code = 400 } = data || {}

		this.message = `[ERROR] ${message}`
		this.error = data
		this.systemErrors = rest
		this.code = code
	}
}

export type ExtractOmitType<T, S extends string> = Omit<T, S>

export function extractOmit<T>(entity: T, skipKeys: string[]): ExtractOmitType<T, typeof skipKeys[number]> {
	const spreadEntity = { ...entity }
	for (const key of skipKeys) {
		delete spreadEntity[key]
	}
	return spreadEntity
}
