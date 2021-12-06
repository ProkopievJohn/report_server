import type { RouterContext } from 'koa-router'
import bcrypt from 'bcrypt'
import { IsNotEmpty, IsString, IsEmail } from 'class-validator'
import { EUserStatuses } from 'src/constants'
import { meFormatService } from 'src/api/services/auth'
import { IUser, UserCollection } from 'src/models/user'
import { CompanyCollection, ICompany } from 'src//models/company'
import { normalizeEmailAddress } from 'src/utils/normalize'
import { badRequest, dataConflict, resolve } from 'src/utils/responseHelpers'
import { validateAndConvert, ValidateResponse } from 'src/utils/validator'
import { generateAccessToken } from 'src/utils/helpers'

export class LoginRequest {
	@IsNotEmpty()
	@IsString()
	@IsEmail()
	email: string

	@IsNotEmpty()
	@IsString()
	password: string
}

export default async (ctx: RouterContext<LoginRequest>): Promise<void> => {
	const { body } = ctx.request

	const errors: boolean | ValidateResponse = await validateAndConvert(LoginRequest, body)

	if (errors) {
		const validateResponse = errors as ValidateResponse
		return badRequest(ctx, validateResponse)
	}

	const { email: rawEmail, password } = body

	const email: string = normalizeEmailAddress(rawEmail)

	const me: IUser = await UserCollection.findOne({ email })

	if (!me) {
		return badRequest(ctx, {
			message: 'Email or password invalid!',
		})
	}

	const isPasswordCompare = await bcrypt.compare(password, me.password)

	if (!isPasswordCompare) {
		return badRequest(ctx, {
			message: 'Email or password invalid!',
		})
	}

	if (me.status > EUserStatuses.INACTIVE) {
		return dataConflict(ctx, {
			message: 'Acount deleted or inactive! Please contact your admin or support!',
		})
	}

	if (!me.emailVerified) {
		return dataConflict(ctx, {
			message: 'Email do not verified! Please check your email or resend verification link!',
		})
	}

	const company: ICompany = await CompanyCollection.findOne({ _id: me.companyId })

	const accessToken: string = generateAccessToken(me)

	return resolve(ctx, meFormatService(me, company, accessToken))
}
