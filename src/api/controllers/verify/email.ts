import type { RouterContext } from 'koa-router'
import { meFormatService } from 'src/api/services'
import { ECompanyStatuses, EUserRoles, EUserStatuses, EVerificationsTypes } from 'src/constants'
import { CompanyCollection, ICompany } from 'src/models/company'
import { IUser, UserCollection } from 'src/models/user'
import { IVerification, VerificationCollection } from 'src/models/verification'
import { generateAccessToken } from 'src/utils/helpers'
import { badRequest, notFound, resolve } from 'src/utils/responseHelpers'

export default async (ctx: RouterContext): Promise<void> => {
	const { token } = ctx.params

	const verification: IVerification = await VerificationCollection.findOne({
		token,
		type: EVerificationsTypes.VERIFY_EMAIL,
	})

	if (!verification) {
		return badRequest(ctx, {
			message: 'Link expired or is invalid! Try resend link!',
		})
	}

	const user: IUser = await UserCollection.findOne({ _id: verification.creatorId })

	if (!user) {
		return notFound(ctx, {
			message: 'User not found!',
		})
	}

	let company: ICompany = await CompanyCollection.findOne({ _id: user.companyId })

	if (!company) {
		return notFound(ctx, {
			message: 'Company not found!',
		})
	}

	if (user.emailVerified) {
		return badRequest(ctx, {
			message: 'Email already verified!',
		})
	}

	const newUser: IUser = {
		...user,
		emailVerified: true,
		status: EUserStatuses.ACTIVE,
	}
	const updatedUser: IUser = await UserCollection.update(newUser)

	if (newUser.role <= EUserRoles.ADMIN) {
		const newCompany: ICompany = {
			...company,
			status: ECompanyStatuses.ACTIVE,
		}

		company = await CompanyCollection.update(newCompany)
	}

	await VerificationCollection.remove({ _id: verification._id })

	const accessToken: string = generateAccessToken(user)

	return resolve(ctx, meFormatService(updatedUser, company, accessToken))
}
