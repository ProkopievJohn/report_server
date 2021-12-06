import type { RouterContext } from 'koa-router'
import bcrypt from 'bcrypt'
import crypto from 'crypto-js'
import { IsEmail, IsNotEmpty, IsString } from 'class-validator'
import { validateAndConvert, ValidateResponse } from 'src/utils/validator'
import { badRequest, dataConflict, resolve } from 'src/utils/responseHelpers'
import { normalizeEmailAddress, normalizeName } from 'src/utils/normalize'
import { IUser, UserCollection } from 'src/models/user'
import { CompanyCollection, ICompany } from 'src/models/company'
import { ECompanyStatuses, EUserRoles, EUserStatuses, EVerificationsTypes } from 'src/constants'
import { VerificationCollection } from 'src/models/verification'
import { sendMail } from 'src/utils/email'
import config from 'config'
import { meFormatService } from 'src/api/services'

class RegisterRequest {
	@IsNotEmpty()
	@IsString()
	@IsEmail()
	email: string

	@IsNotEmpty()
	@IsString()
	name: string

	@IsNotEmpty()
	@IsString()
	surname: string

	@IsNotEmpty()
	@IsString()
	password: string

	@IsNotEmpty()
	@IsString()
	companyName: string
}

export default async (ctx: RouterContext<RegisterRequest>): Promise<void> => {
	const { body } = ctx.request

	const errors: boolean | ValidateResponse = await validateAndConvert(RegisterRequest, body)

	if (errors) {
		const validateResponse = errors as ValidateResponse
		return badRequest(ctx, validateResponse)
	}

	const {
		name: rawName,
		surname: rawSurname,
		email: rawEmail,
		password,
		companyName: rawCompanyName,
	}: RegisterRequest = body

	const email: string = normalizeEmailAddress(rawEmail)
	const companyName: string = normalizeName(rawCompanyName)
	const name: string = normalizeName(rawName)
	const surname: string = normalizeName(rawSurname)

	const existingUser: IUser = await UserCollection.findOne({ email })

	if (existingUser) {
		return dataConflict(ctx, {
			message: 'That email address is already in use by another account!',
		})
	}

	const existingCompany: ICompany = await CompanyCollection.findOne({ name: companyName })

	if (existingCompany) {
		return dataConflict(ctx, {
			message: 'That company name is already in use by another account!',
		})
	}

	const company: ICompany = await CompanyCollection.insertOne({
		name: companyName,
		status: ECompanyStatuses.INACTIVE,
	})

	const user: IUser = await UserCollection.insertOne({
		name,
		surname,
		email,
		emailVerified: false,
		password: bcrypt.hashSync(password, 10),
		companyId: company._id,
		role: EUserRoles.OWNER,
		status: EUserStatuses.INACTIVE,
		rate: 0,
		abilities: [],
	})

	const token: string = crypto.lib.WordArray.random(16).toString(crypto.enc.Hex)

	await VerificationCollection.insertOne({
		createdAt: new Date(),
		creatorId: user._id,
		type: EVerificationsTypes.VERIFY_EMAIL,
		token,
	})

	await sendMail(user.email, {
		subject: 'Confirm email from Report service',
		text: `${config.rootUrl}/api/verify/email/${token}`,
	})

	return resolve(ctx, meFormatService(user, company))
}
