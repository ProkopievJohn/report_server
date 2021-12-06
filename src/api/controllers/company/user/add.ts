import type { RouterContext } from 'koa-router'
import { Context } from 'koa'
import crypto from 'crypto-js'
import { ObjectId } from 'mongodb'
import {
	IsNotEmpty,
	IsString,
	IsEmail,
	IsNumber,
	Min,
	IsArray,
	IsEnum,
} from 'class-validator'
import { EUserRoles, EUserStatuses, EVerificationsTypes } from 'src/constants'
import { CustomIsMongoId, validateAndConvert, ValidateResponse } from 'src/utils/validator'
import { badRequest, dataConflict, forbidden, resolve } from 'src/utils/responseHelpers'
import { normalizeEmailAddress, normalizeName } from 'src/utils/normalize'
import { IUser, UserCollection } from 'src/models/user'
import { AbilityCollection } from 'src/models/ability'
import { VerificationCollection } from 'src/models/verification'
import { sendMail } from 'src/utils/email'
import config from 'config'

class AddUserRequest {
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
	@IsNumber()
	@Min(0)
	rate: number

	@IsNotEmpty()
	@IsEnum(EUserRoles)
	role: EUserRoles

	@IsNotEmpty()
	@IsArray()
	@CustomIsMongoId()
	abilities: ObjectId[]
}

export default async (ctx: RouterContext<Context, AddUserRequest>): Promise<void> => {
	const { _id, companyId } = ctx.state.user
	const { body } = ctx.request

	const errors: boolean | ValidateResponse = await validateAndConvert(AddUserRequest, body)

	if (errors) {
		const validateResponse = errors as ValidateResponse
		return badRequest(ctx, validateResponse)
	}

	const {
		email: rawEmail,
		name: rawName,
		surname: rawSurname,
		rate,
		role,
		abilities: rawAbilities,
	}: AddUserRequest = body

	const email: string = normalizeEmailAddress(rawEmail)
	const name: string = normalizeName(rawName)
	const surname: string = normalizeName(rawSurname)
	const abilities: ObjectId[] = rawAbilities.map((a: ObjectId | string): ObjectId => new ObjectId(a))

	const creator: IUser = await UserCollection.findOne({ _id })

	if (creator.role >= role) {
		return forbidden(ctx, {
			message: 'You do not have access to create user with this role!',
		})
	}

	const existingUser: IUser = await UserCollection.findOne({ email })

	if (existingUser) {
		return dataConflict(ctx, {
			message: 'That email address is already in use by another account!',
		})
	}

	const existAbilitiesCount: number = abilities.length
		? await AbilityCollection.count({
			$and: [
				{
					_id: {
						$in: abilities,
					},
				},
				{ companyId },
			],
		})
		: 0

	if (existAbilitiesCount !== abilities.length) {
		return badRequest(ctx, {
			message: 'You have wrong ability!',
		})
	}

	const user: IUser = await UserCollection.insertOne({
		name,
		surname,
		email,
		emailVerified: false,
		companyId,
		role,
		status: EUserStatuses.INACTIVE,
		rate,
		abilities,
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

	return resolve(ctx, {
		user,
	})
}
