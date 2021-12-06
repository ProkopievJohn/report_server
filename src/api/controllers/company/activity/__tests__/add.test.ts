import { agent } from 'supertest'
import { ObjectId } from 'mongodb'
import { boot } from 'src/server'
import { IUser, UserCollection } from 'src/models/user'
import { EAbilityStatuses, EActivityStatuses, EProjectStatuses, EUserRoles, EUserStatuses } from 'src/constants'
import { generateAccessToken } from 'src/utils/helpers'
import { AbilityCollection, IAbility } from 'src/models/ability'
import { IProject, ProjectCollection } from 'src/models/project'
import { ActivityCollection, IActivity } from 'src/models/activity'
import { endOfDay, startOfDay } from 'src/utils/date'

process.env.NODE_ENV = 'test'

describe('package : company : activity', () => {
	let httpServer
	let request
	const since = startOfDay(new Date())
	const to = endOfDay(new Date(new Date().setDate(new Date().getDate() + 1)))

	const ability: IAbility = {
		_id: new ObjectId(),
		name: "name",
		description: "description",
		companyId: new ObjectId(),
		status: EAbilityStatuses.ACTIVE,
		history: []
	}
	const project: IProject = {
		_id: new ObjectId(),
		name: "name",
		description: "description",
		companyId: new ObjectId(),
		creatorId: new ObjectId(),
		status: EProjectStatuses.ACTIVE,
		since: new Date(),
		to: new Date(),
		abilities: [{
			abilityId: ability._id,
			hours: 8,
			rate: 40,
			since,
			to,
		}],
		history: []
	}
	const user: IUser = {
		_id: new ObjectId(),
		name: 'name',
		surname: 'surname',
		email: 'email@email.email',
		password: 'password',
		rate: 0,
		emailVerified: false,
		companyId: new ObjectId(),
		role: EUserRoles.ADMIN,
		status: EUserStatuses.INACTIVE,
		abilities: [ability._id],
		history: []
	}
	const activity: IActivity = {
		_id: new ObjectId(),
		userId: user._id,
		abilityId: ability._id,
		projectId: project._id,
		companyId: user.companyId,
		creatorId: user._id,
		since,
		to,
		status: EActivityStatuses.ACTIVE,
		history: []
	}

	const accessToken = 'Bearer ' + generateAccessToken(user)

	const requestBody = {
		abilityId: ability._id.toString(),
		projectId: project._id.toString(),
		userId: user._id.toString(),
		since: since.toISOString(),
		to: to.toISOString(),
	}

	beforeAll(async () => {
		httpServer = (await boot()).listen()
		request = agent(httpServer)
	})

	describe('POST /api/company/activity', () => {
		it('should create activity', async () => {
			jest
				.spyOn(UserCollection, 'findOne')
				.mockReturnValue(Promise.resolve(user));
			jest
				.spyOn(ActivityCollection, 'count')
				.mockReturnValue(Promise.resolve(0));
			jest
				.spyOn(AbilityCollection, 'count')
				.mockReturnValue(Promise.resolve(1));
			jest
				.spyOn(ProjectCollection, 'findOne')
				.mockReturnValue(Promise.resolve(project));
			jest
				.spyOn(ActivityCollection, 'insertOne')
				.mockReturnValue(Promise.resolve(activity));

			const response = await request.post('/api/company/activity')
				.send(requestBody)
				.set('authorization', accessToken)

			expect(response.status).toEqual(200)
			expect(response.body.success).toEqual(true)
			expect(response.body.data).toHaveProperty('activity')
		})

		it('should not create activity - activity not in project range', async () => {
			jest
				.spyOn(UserCollection, 'findOne')
				.mockReturnValue(Promise.resolve(user));
			jest
				.spyOn(ActivityCollection, 'count')
				.mockReturnValue(Promise.resolve(0));
			jest
				.spyOn(AbilityCollection, 'count')
				.mockReturnValue(Promise.resolve(1));
			jest
				.spyOn(ProjectCollection, 'findOne')
				.mockReturnValue(Promise.resolve({ ...project, abilities: [{ ...project.abilities[0], to: since }] }));

			const response = await request.post('/api/company/activity')
				.send(requestBody)
				.set('authorization', accessToken)

			expect(response.status).toEqual(400)
			expect(response.body.success).toEqual(false)
			expect(response.body.data).toHaveProperty('message')
		})

		it('should not create activity - project does not have ability', async () => {
			jest
				.spyOn(UserCollection, 'findOne')
				.mockReturnValue(Promise.resolve(user));
			jest
				.spyOn(ActivityCollection, 'count')
				.mockReturnValue(Promise.resolve(0));
			jest
				.spyOn(AbilityCollection, 'count')
				.mockReturnValue(Promise.resolve(1));
			jest
				.spyOn(ProjectCollection, 'findOne')
				.mockReturnValue(Promise.resolve({ ...project, abilities: [] }));

			const response = await request.post('/api/company/activity')
				.send(requestBody)
				.set('authorization', accessToken)

			expect(response.status).toEqual(400)
			expect(response.body.success).toEqual(false)
			expect(response.body.data).toHaveProperty('message')
		})

		it('should not create activity - user does not have ability', async () => {
			jest
				.spyOn(UserCollection, 'findOne')
				.mockReturnValue(Promise.resolve({ ...user, abilities: [] }));
			jest
				.spyOn(ActivityCollection, 'count')
				.mockReturnValue(Promise.resolve(0));
			jest
				.spyOn(AbilityCollection, 'count')
				.mockReturnValue(Promise.resolve(1));

			const response = await request.post('/api/company/activity')
				.send(requestBody)
				.set('authorization', accessToken)

			expect(response.status).toEqual(400)
			expect(response.body.success).toEqual(false)
			expect(response.body.data).toHaveProperty('message')
		})

		it('should not create activity - wrong project id', async () => {
			jest
				.spyOn(UserCollection, 'findOne')
				.mockReturnValue(Promise.resolve({ ...user, abilities: [] }));
			jest
				.spyOn(ActivityCollection, 'count')
				.mockReturnValue(Promise.resolve(0));
			jest
				.spyOn(AbilityCollection, 'count')
				.mockReturnValue(Promise.resolve(1));
			jest
				.spyOn(ProjectCollection, 'findOne')
				.mockReturnValue(Promise.resolve(undefined));

			const response = await request.post('/api/company/activity')
				.send(requestBody)
				.set('authorization', accessToken)

			expect(response.status).toEqual(400)
			expect(response.body.success).toEqual(false)
			expect(response.body.data).toHaveProperty('message')
		})

		it('should not create activity - wrong ability id', async () => {
			jest
				.spyOn(UserCollection, 'findOne')
				.mockReturnValue(Promise.resolve(user));
			jest
				.spyOn(ActivityCollection, 'count')
				.mockReturnValue(Promise.resolve(0));
			jest
				.spyOn(AbilityCollection, 'count')
				.mockReturnValue(Promise.resolve(0));

			const response = await request.post('/api/company/activity')
				.send(requestBody)
				.set('authorization', accessToken)

			expect(response.status).toEqual(400)
			expect(response.body.success).toEqual(false)
			expect(response.body.data).toHaveProperty('message')
		})

		it('should not create activity - wrong user id', async () => {
			const wrongUserId = new ObjectId()
			jest
				.spyOn(UserCollection, 'findOne')
				.mockImplementation(async q => {
					if (wrongUserId.toString() === q._id.toString()) {
						return
					}

					return user
				})
			jest
				.spyOn(ActivityCollection, 'count')
				.mockReturnValue(Promise.resolve(0));

			const response = await request.post('/api/company/activity')
				.send({ ...requestBody, userId: wrongUserId })
				.set('authorization', accessToken)

			expect(response.status).toEqual(400)
			expect(response.body.success).toEqual(false)
			expect(response.body.data).toHaveProperty('message')
		})

		it('should not create activity - activity already exist', async () => {
			jest
				.spyOn(UserCollection, 'findOne')
				.mockReturnValue(Promise.resolve(user));
			jest
				.spyOn(ActivityCollection, 'count')
				.mockReturnValue(Promise.resolve(1));

			const response = await request.post('/api/company/activity')
				.send(requestBody)
				.set('authorization', accessToken)

			expect(response.status).toEqual(409)
			expect(response.body.success).toEqual(false)
			expect(response.body.data).toHaveProperty('message')
		})

		it('should not create activity - has not permission', async () => {
			jest
				.spyOn(UserCollection, 'findOne')
				.mockReturnValue(Promise.resolve({ ...user, role: EUserRoles.USER }));

			const response = await request.post('/api/company/activity')
				.send(requestBody)
				.set('authorization', accessToken)

			expect(response.status).toEqual(403)
			expect(response.body.success).toEqual(false)
			expect(response.body.data).toHaveProperty('message')
		})

		it('should not create activity - unauthorized', async () => {
			const response = await request.post('/api/company/activity')
				.send(requestBody)
	
			expect(response.status).toEqual(401)
			expect(response.body.success).toEqual(false)
			expect(response.body.data).toHaveProperty('message')
		})
	})

	afterAll(done => {
		httpServer.close()
		jest.resetModules()
		done()
	})
})
