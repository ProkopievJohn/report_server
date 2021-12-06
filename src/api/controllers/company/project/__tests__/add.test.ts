import { agent } from 'supertest'
import { ObjectId } from 'mongodb'
import { boot } from 'src/server'
import { IProject, ProjectCollection } from 'src/models/project'
import { EProjectStatuses, EUserRoles, EUserStatuses } from 'src/constants'
import { IUser, UserCollection } from 'src/models/user'
import { generateAccessToken, generateWrongJwt } from 'src/utils/helpers'
import { endOfDay, startOfDay } from 'src/utils/date'
import { AbilityCollection } from 'src/models/ability'

process.env.NODE_ENV = 'test'

describe('package : company : project', () => {
	let httpServer
	let request

	const since = startOfDay(new Date())
	const to = endOfDay(new Date(new Date().setDate(new Date().getDate() + 1)))

	const project: IProject = {
		_id: new ObjectId(),
		name: "name",
		description: "description",
		companyId: new ObjectId(),
		creatorId: new ObjectId(),
		status: EProjectStatuses.ACTIVE,
		since,
		to,
		abilities: [],
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
		abilities: [],
		history: []
	}
	const accessToken = 'Bearer ' + generateAccessToken(user)

	const requestBody = {
		name: "name",
		description: "description",
		since,
		to,
		abilities: [{
			abilityId: new ObjectId(),
			rate: 25,
			hours: 8,
			since,
			to,
		}]
	}

	beforeAll(async () => {
		httpServer = (await boot()).listen()
		request = agent(httpServer)
	})

	describe('POST /api/company/project', () => {
		it('should create project', async () => {
			jest
				.spyOn(UserCollection, 'findOne')
				.mockReturnValue(Promise.resolve(user));
			jest
				.spyOn(ProjectCollection, 'count')
				.mockReturnValue(Promise.resolve(0));
			jest
				.spyOn(AbilityCollection, 'count')
				.mockReturnValue(Promise.resolve(1));
			jest
				.spyOn(ProjectCollection, 'insertOne')
				.mockReturnValue(Promise.resolve(project));

			const response = await request.post('/api/company/project')
				.send(requestBody)
				.set('authorization', accessToken)

			expect(response.status).toEqual(200)
			expect(response.body.success).toEqual(true)
			expect(response.body.data).toHaveProperty('project')
		})

		it('should not create project - wrong ability', async () => {
			jest
				.spyOn(UserCollection, 'findOne')
				.mockReturnValue(Promise.resolve(user));
			jest
				.spyOn(ProjectCollection, 'count')
				.mockReturnValue(Promise.resolve(0));
			jest
				.spyOn(AbilityCollection, 'count')
				.mockReturnValue(Promise.resolve(0));

			const response = await request.post('/api/company/project')
				.send(requestBody)
				.set('authorization', accessToken)

			expect(response.status).toEqual(400)
			expect(response.body.success).toEqual(false)
			expect(response.body.data).toHaveProperty('message')
		})

		it('should not create project - project already exist', async () => {
			jest
				.spyOn(UserCollection, 'findOne')
				.mockReturnValue(Promise.resolve(user));
			jest
				.spyOn(ProjectCollection, 'count')
				.mockReturnValue(Promise.resolve(1));

			const response = await request.post('/api/company/project')
				.send(requestBody)
				.set('authorization', accessToken)

			expect(response.status).toEqual(400)
			expect(response.body.success).toEqual(false)
			expect(response.body.data).toHaveProperty('message')
		})

		it('should not create project - ability not in project range', async () => {
			jest
				.spyOn(UserCollection, 'findOne')
				.mockReturnValue(Promise.resolve(user));

			const response = await request.post('/api/company/project')
				.send({ ...requestBody, to: since })
				.set('authorization', accessToken)

			expect(response.status).toEqual(400)
			expect(response.body.success).toEqual(false)
			expect(response.body.data).toHaveProperty('message')
		})

		it('should not create project - wrong ability', async () => {
			jest
				.spyOn(UserCollection, 'findOne')
				.mockReturnValue(Promise.resolve(user));

			const response = await request.post('/api/company/project')
				.send({
					...requestBody,
					abilities: [{ abilityId: 'wrong id', rate: -100, hours: 10, since: '1abc23', to: '2abc345' }]
				})
				.set('authorization', accessToken)

			expect(response.status).toEqual(400)
			expect(response.body.success).toEqual(false)
			expect(response.body.data).toHaveProperty('message')
			expect(response.body.data).toHaveProperty('fields')
		})

		it('should not create project - wrong project', async () => {
			jest
				.spyOn(UserCollection, 'findOne')
				.mockReturnValue(Promise.resolve(user));

			const response = await request.post('/api/company/project')
				.send({
					...requestBody,
					name: 123,
					since: 'wrong since'
				})
				.set('authorization', accessToken)

			expect(response.status).toEqual(400)
			expect(response.body.success).toEqual(false)
			expect(response.body.data).toHaveProperty('message')
			expect(response.body.data).toHaveProperty('fields')
		})

		it('should not create project - unauthorized', async () => {
			const response = await request.post('/api/company/project')
				.send(requestBody)

			expect(response.status).toEqual(401)
			expect(response.body.success).toEqual(false)
			expect(response.body.data).toHaveProperty('message')
		})

		it('should not create project - has not permission', async () => {
			jest
				.spyOn(UserCollection, 'findOne')
				.mockReturnValue(Promise.resolve({ ...user, role: EUserRoles.USER }));

			const response = await request.post('/api/company/project')
				.send(requestBody)
				.set('authorization', accessToken)

			expect(response.status).toEqual(403)
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
