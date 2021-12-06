import type { RouterContext } from 'koa-router'
import type { Context } from 'koa'
import { ObjectId } from 'mongodb'
import {
	IsNotEmpty,
	IsString,
	IsOptional,
	IsDateString,
	IsInt,
	IsPositive,
	Min,
	Max,
	IsNumber,
} from 'class-validator'
import { CustomIsMongoId, IsNonPrimitiveArray, validateAndConvert, ValidateResponse } from 'src/utils/validator'
import { badRequest, resolve } from 'src/utils/responseHelpers'
import { normalizeName } from 'src/utils/normalize'
import { endOfDay, isInRangeWithSame, isSameOrAfter, normalizeDate, startOfDay } from 'src/utils/date'
import { IProject, IProjectAbility, ProjectCollection } from 'src/models/project'
import { AbilityCollection } from 'src/models/ability'
import { EProjectStatuses } from 'src/constants'

class AddProjectAbility {
	@IsNotEmpty()
	@CustomIsMongoId()
	abilityId: ObjectId

	@IsNotEmpty()
	@IsInt()
	@IsPositive()
	@Min(1)
	@Max(8)
	hours: number

	@IsNotEmpty()
	@IsNumber()
	@Min(0)
	rate: number

	@IsNotEmpty()
	@IsDateString()
	since: Date

	@IsNotEmpty()
	@IsDateString()
	to: Date
}

// tslint:disable-next-line: max-classes-per-file
class AddProjectRequest {
	@IsNotEmpty()
	@IsString()
	name: string

	@IsOptional()
	@IsString()
	description: string

	@IsNotEmpty()
	@IsDateString()
	since: string

	@IsNotEmpty()
	@IsDateString()
	to: string

	@IsNonPrimitiveArray(AddProjectAbility)
	abilities: AddProjectAbility[]
}

export default async (ctx: RouterContext<Context, AddProjectRequest>): Promise<void> => {
	const { _id, companyId } = ctx.state.user
	const { body } = ctx.request

	const errors: boolean | ValidateResponse = await validateAndConvert(AddProjectRequest, body)

	if (errors) {
		const validateResponse = errors as ValidateResponse
		return badRequest(ctx, validateResponse)
	}

	const {
		name: rawName,
		description: rawDescription,
		since: rawSince,
		to: rawTo,
		abilities: rawAbilities,
	} = body

	const name: string = normalizeName(rawName)
	const description: string = normalizeName(rawDescription)
	const since: Date = startOfDay(normalizeDate(rawSince))
	const to: Date = endOfDay(normalizeDate(rawTo))
	const abilities: IProjectAbility[] = rawAbilities.map((rawAbility: AddProjectAbility): IProjectAbility => {
		const sinceAbility: Date = startOfDay(normalizeDate(rawAbility.since))
		const toAbility: Date = endOfDay(normalizeDate(rawAbility.to))
		return {
			abilityId: new ObjectId(rawAbility.abilityId),
			rate: Number(rawAbility.rate),
			hours: Number(rawAbility.hours),
			since: sinceAbility,
			to: toAbility,
		}
	})

	if (isSameOrAfter(since, to)) {
		return badRequest(ctx, {
			message: 'Project since date is same or after to date!',
		})
	}

	if (abilities.some((ability: IProjectAbility) => isSameOrAfter(ability.since, ability.to))) {
		return badRequest(ctx, {
			message: 'Project ability since date is same or after to date!',
		})
	}

	if (abilities.some((ability: IProjectAbility) => !isInRangeWithSame(since, to, [ability.since, ability.to]))) {
		return badRequest(ctx, {
			message: 'Ability not in project range!',
		})
	}

	const existProject: number = await ProjectCollection.count({ name, companyId })

	if (existProject) {
		return badRequest(ctx, {
			message: 'Project with this name alredy exist!',
		})
	}

	const existAbilitiesCount: number = abilities.length
		? await AbilityCollection.count({
			_id: {
				$in: abilities.map((projectAbility: IProjectAbility) => projectAbility.abilityId),
			},
			companyId,
		})
		: 0

	if (existAbilitiesCount !== abilities.length) {
		return badRequest(ctx, {
			message: 'You have wrong ability!',
		})
	}

	const project: IProject = await ProjectCollection.insertOne({
		name,
		description,
		since,
		to,
		abilities,
		status: EProjectStatuses.ACTIVE,
		companyId,
		creatorId: _id,
	})

	return resolve(ctx, {
		project,
	})
}
