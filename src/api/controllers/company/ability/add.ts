import type { RouterContext } from 'koa-router'
import type { Context } from 'koa'
import { IsNotEmpty, IsString, IsOptional } from 'class-validator'
import { validateAndConvert, ValidateResponse } from 'src/utils/validator'
import { badRequest, resolve } from 'src/utils/responseHelpers'
import { normalizeName } from 'src/utils/normalize'
import { AbilityCollection, IAbility } from 'src/models/ability'
import { EAbilityStatuses } from 'src/constants'

class AddAbilityRequest {
	@IsNotEmpty()
	@IsString()
	name: string

	@IsOptional()
	@IsString()
	description: string
}

export default async (ctx: RouterContext<Context, AddAbilityRequest>): Promise<void> => {
	const { companyId } = ctx.state.user
	const { body } = ctx.request

	const errors: boolean | ValidateResponse = await validateAndConvert(AddAbilityRequest, body)

	if (errors) {
		const validateResponse = errors as ValidateResponse
		return badRequest(ctx, validateResponse)
	}

	const {
		name: rawName,
		description,
	} = body

	const name: string = normalizeName(rawName)

	const existAbility: IAbility = await AbilityCollection.findOne({ name, companyId })

	if (existAbility) {
		return badRequest(ctx, {
			message: 'Ability with this name alredy exist!',
		})
	}

	const ability: IAbility = await AbilityCollection.insertOne({
		name,
		description: description || '',
		companyId,
		status: EAbilityStatuses.ACTIVE,
	})

	return resolve(ctx, {
		ability,
	})
}
