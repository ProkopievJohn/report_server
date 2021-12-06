import { ObjectId } from 'mongodb'
import { EAbilityStatuses, EUserRoles, EUserStatuses } from 'src/constants'
import { AbilityCollection, IAbility } from 'src/models/ability'
import { IUser, UserCollection } from 'src/models/user'
import { boot } from 'src/server'
import { generateAccessToken } from 'src/utils/helpers'
import { agent } from 'supertest'

process.env.NODE_ENV = 'test'

describe('package : company : ability', () => {
	let httpServer
	let request
	const name = 'name'
	const description = 'description'
	const ability: IAbility = {
		_id: new ObjectId(),
		name,
		description,
		companyId: new ObjectId(),
		status: EAbilityStatuses.ACTIVE,
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
		abilities: [new ObjectId()],
		history: []
	}
	const accessToken = 'Bearer ' + generateAccessToken(user)

	beforeAll(async () => {
		httpServer = (await boot()).listen()
		request = agent(httpServer)
	})

	describe('POST /api/company/ability', () => {
		it('should create ability', async () => {
			jest
				.spyOn(UserCollection, 'findOne')
				.mockReturnValue(Promise.resolve(user));
			jest
				.spyOn(AbilityCollection, 'findOne')
				.mockReturnValue(Promise.resolve(undefined));
			jest
				.spyOn(AbilityCollection, 'insertOne')
				.mockReturnValue(Promise.resolve(ability));

			const response = await request.post('/api/company/ability').send({
				name,
				description,
			})
			.set('authorization', accessToken)

			expect(response.status).toEqual(200)
			expect(response.body.success).toEqual(true)
			expect(response.body.data).toHaveProperty('ability')
			expect(response.body.data.ability.name).toEqual(name)
			expect(response.body.data.ability.description).toEqual(description)
		})

		it('should not create ability - ability already exist', async () => {
			jest
				.spyOn(UserCollection, 'findOne')
				.mockReturnValue(Promise.resolve(user));
			jest
				.spyOn(AbilityCollection, 'findOne')
				.mockReturnValue(Promise.resolve(ability));

			const response = await request.post('/api/company/ability').send({
				name,
				description,
			})
			.set('authorization', accessToken)

			expect(response.status).toEqual(400)
			expect(response.body.success).toEqual(false)
			expect(response.body.data).toHaveProperty('message')
		})

		it('should not create ability - wrong ability name', async () => {
			jest
				.spyOn(UserCollection, 'findOne')
				.mockReturnValue(Promise.resolve(user));

			const response = await request.post('/api/company/ability').send({
				description,
			})
			.set('authorization', accessToken)

			expect(response.status).toEqual(400)
			expect(response.body.success).toEqual(false)
			expect(response.body.data).toHaveProperty('message')
			expect(response.body.data).toHaveProperty('fields')
		})

		it('should not create ability - has not permission', async () => {
			jest
				.spyOn(UserCollection, 'findOne')
				.mockReturnValue(Promise.resolve({ ...user, role: EUserRoles.USER }));

			const response = await request.post('/api/company/ability').send({
				name,
				description,
			})
			.set('authorization', accessToken)

			expect(response.status).toEqual(403)
			expect(response.body.success).toEqual(false)
			expect(response.body.data).toHaveProperty('message')
		})

		it('should not create ability - unauthorized', async () => {
			const response = await request.post('/api/company/ability').send({
				name,
				description,
			})
	
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
