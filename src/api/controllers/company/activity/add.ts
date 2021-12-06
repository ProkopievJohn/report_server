import type { RouterContext } from 'koa-router'
import { Context } from 'koa'
import { ObjectId } from 'mongodb'
import { IsNotEmpty, IsDateString } from 'class-validator'
import { CustomIsMongoId, validateAndConvert, ValidateResponse } from 'src/utils/validator'
import { badRequest, dataConflict, resolve } from 'src/utils/responseHelpers'
import { endOfDay, isInRangeWithSame, normalizeDate, startOfDay } from 'src/utils/date'
import { ActivityCollection, IActivity } from 'src/models/activity'
import { IUser, UserCollection } from 'src/models/user'
import { AbilityCollection } from 'src/models/ability'
import { IProject, IProjectAbility, ProjectCollection } from 'src/models/project'
import { EActivityStatuses } from 'src/constants'

class AddActivityRequest {
	@IsNotEmpty()
	@CustomIsMongoId()
	projectId: ObjectId

	@IsNotEmpty()
	@CustomIsMongoId()
	userId: ObjectId

	@IsNotEmpty()
	@CustomIsMongoId()
	abilityId: ObjectId

	@IsNotEmpty()
	@IsDateString()
	since: Date

	@IsNotEmpty()
	@IsDateString()
	to: Date
}

export default async (ctx: RouterContext<Context, AddActivityRequest>): Promise<void> => {
	const { _id, companyId } = ctx.state.user
	const { body } = ctx.request

	const errors: boolean | ValidateResponse = await validateAndConvert(AddActivityRequest, body)

	if (errors) {
		const validateResponse = errors as ValidateResponse
		return badRequest(ctx, validateResponse)
	}

	const {
		projectId: rawProjectId,
		userId: rawUserId,
		abilityId: rawAbilityId,
		since: rawSince,
		to: rawTo,
	}: AddActivityRequest = body

	const projectId: ObjectId = new ObjectId(rawProjectId)
	const userId: ObjectId = new ObjectId(rawUserId)
	const abilityId: ObjectId = new ObjectId(rawAbilityId)
	const since: Date = startOfDay(normalizeDate(rawSince))
	const to: Date = endOfDay(normalizeDate(rawTo))

	const existingActivity: number = await ActivityCollection.count({
		projectId,
		userId,
		abilityId,
		companyId,
	})

	if (existingActivity) {
		return dataConflict(ctx, {
			message: 'Activity for this user, ability and project is already exist!',
		})
	}

	const user: IUser = await UserCollection.findOne({ _id: userId })

	if (!user) {
		return badRequest(ctx, {
			message: `Cannot find user with ${rawUserId} id!`,
		})
	}

	const abilityExist: number = await AbilityCollection.count({ _id: abilityId })

	if (!abilityExist) {
		return badRequest(ctx, {
			message: `Cannot find ability with ${rawAbilityId} id!`,
		})
	}

	const project: IProject = await ProjectCollection.findOne({ _id: projectId })

	if (!project) {
		return badRequest(ctx, {
			message: `Cannot find project with ${rawProjectId} id!`,
		})
	}

	if (user.abilities.every((a: ObjectId) => a.toString() !== abilityId.toString())) {
		return badRequest(ctx, {
			message: 'User does not have this ability!',
		})
	}

	const projectAbility: IProjectAbility =
		project.abilities.find((pa: IProjectAbility) => pa.abilityId.toString() === abilityId.toString())

	if (!projectAbility) {
		return badRequest(ctx, {
			message: 'Project does not have this ability!',
		})
	}

	if (!isInRangeWithSame(projectAbility.since, projectAbility.to, [since, to])) {
		return badRequest(ctx, {
			message: 'Activity not in project range!',
		})
	}

	const activity: IActivity = await ActivityCollection.insertOne({
		userId,
		abilityId,
		projectId,
		companyId,
		creatorId: _id,
		since,
		to,
		status: EActivityStatuses.ACTIVE,
	})

	return resolve(ctx, {
		activity,
	})
}
