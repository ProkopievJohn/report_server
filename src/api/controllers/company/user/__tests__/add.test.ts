import { ObjectId } from 'mongodb'
import { EAbilityStatuses, EUserRoles, EUserStatuses, EVerificationsTypes } from 'src/constants'
import { AbilityCollection, IAbility } from 'src/models/ability'
import { IUser, UserCollection } from 'src/models/user'
import { IVerification, VerificationCollection } from 'src/models/verification'
import { boot } from 'src/server'
import { generateAccessToken } from 'src/utils/helpers'
import { agent } from 'supertest'

process.env.NODE_ENV = 'test'

describe('package : company : user', () => {
	let httpServer
	let request
	const ability: IAbility = {
		_id: new ObjectId(),
		name: 'name',
		description: 'description',
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
		role: EUserRoles.OWNER,
		status: EUserStatuses.INACTIVE,
		abilities: [],
		history: []
	}
	const verification: IVerification = {
		createdAt: new Date(),
		creatorId: user._id,
		type: EVerificationsTypes.VERIFY_EMAIL,
		token: 'token',
	}
	const accessToken = 'Bearer ' + generateAccessToken(user)

	const requestBody = {
		email: 'email@email.email',
		name: 'name',
		surname: 'surname',
		rate: 40,
		role: EUserRoles.ADMIN,
		abilities: [ability._id]
	}

	beforeAll(async () => {
		httpServer = (await boot()).listen()
		request = agent(httpServer)
	})

	describe('POST /api/company/user', () => {
		it('owner should create user', async () => {
			jest
				.spyOn(UserCollection, 'findOne')
				.mockImplementation(async q => {
					if (q.email) {
						return
					}

					return user
				})
			jest
				.spyOn(AbilityCollection, 'count')
				.mockReturnValue(Promise.resolve(1));
			jest
				.spyOn(UserCollection, 'insertOne')
				.mockReturnValue(Promise.resolve(user));
			jest
				.spyOn(VerificationCollection, 'insertOne')
				.mockReturnValue(Promise.resolve(verification));

			const response = await request.post('/api/company/user')
				.send({ ...requestBody, role: EUserRoles.USER })
				.set('authorization', accessToken)

			expect(response.status).toEqual(200)
			expect(response.body.success).toEqual(true)
			expect(response.body.data).toHaveProperty('user')
		})

		it('owner should create admin', async () => {
			jest
				.spyOn(UserCollection, 'findOne')
				.mockImplementation(async q => {
					if (q.email) {
						return
					}

					return user
				})
			jest
				.spyOn(AbilityCollection, 'count')
				.mockReturnValue(Promise.resolve(1));
			jest
				.spyOn(UserCollection, 'insertOne')
				.mockReturnValue(Promise.resolve(user));
			jest
				.spyOn(VerificationCollection, 'insertOne')
				.mockReturnValue(Promise.resolve(verification));

			const response = await request.post('/api/company/user')
				.send(requestBody)
				.set('authorization', accessToken)

			expect(response.status).toEqual(200)
			expect(response.body.success).toEqual(true)
			expect(response.body.data).toHaveProperty('user')
		})

		it('admin should create user', async () => {
			jest
				.spyOn(UserCollection, 'findOne')
				.mockImplementation(async q => {
					if (q.email) {
						return
					}

					return { ...user, role: EUserRoles.ADMIN }
				})
			jest
				.spyOn(AbilityCollection, 'count')
				.mockReturnValue(Promise.resolve(1));
			jest
				.spyOn(UserCollection, 'insertOne')
				.mockReturnValue(Promise.resolve(user));
			jest
				.spyOn(VerificationCollection, 'insertOne')
				.mockReturnValue(Promise.resolve(verification));

			const response = await request.post('/api/company/user')
				.send({ ...requestBody, role: EUserRoles.USER })
				.set('authorization', accessToken)

			expect(response.status).toEqual(200)
			expect(response.body.success).toEqual(true)
			expect(response.body.data).toHaveProperty('user')
		})

		it('owner should not create owner - do not have access', async () => {
			jest
				.spyOn(UserCollection, 'findOne')
				.mockImplementation(async q => {
					if (q.email) {
						return
					}

					return user
				})

			const response = await request.post('/api/company/user')
				.send({ ...requestBody, role: EUserRoles.OWNER })
				.set('authorization', accessToken)

			expect(response.status).toEqual(403)
			expect(response.body.success).toEqual(false)
			expect(response.body.data).toHaveProperty('message')
		})

		it('admin should not create owner - do not have access', async () => {
			jest
				.spyOn(UserCollection, 'findOne')
				.mockImplementation(async q => {
					if (q.email) {
						return
					}

					return { ...user, role: EUserRoles.ADMIN }
				})

			const response = await request.post('/api/company/user')
				.send({ ...requestBody, role: EUserRoles.OWNER })
				.set('authorization', accessToken)

			expect(response.status).toEqual(403)
			expect(response.body.success).toEqual(false)
			expect(response.body.data).toHaveProperty('message')
		})

		it('admin should not create admin - do not have access', async () => {
			jest
				.spyOn(UserCollection, 'findOne')
				.mockImplementation(async q => {
					if (q.email) {
						return
					}

					return { ...user, role: EUserRoles.ADMIN }
				})

			const response = await request.post('/api/company/user')
				.send({ ...requestBody, role: EUserRoles.ADMIN })
				.set('authorization', accessToken)

			expect(response.status).toEqual(403)
			expect(response.body.success).toEqual(false)
			expect(response.body.data).toHaveProperty('message')
		})

		it('should not create user - email already exist', async () => {
			jest
				.spyOn(UserCollection, 'findOne')
				.mockReturnValue(Promise.resolve(user))

			const response = await request.post('/api/company/user')
				.send({ ...requestBody, role: EUserRoles.USER })
				.set('authorization', accessToken)

			expect(response.status).toEqual(409)
			expect(response.body.success).toEqual(false)
			expect(response.body.data).toHaveProperty('message')
		})

		it('should not create user - wrong ibility id', async () => {
			jest
				.spyOn(UserCollection, 'findOne')
				.mockImplementation(async q => {
					if (q.email) {
						return
					}

					return user
				})
			jest
				.spyOn(AbilityCollection, 'count')
				.mockReturnValue(Promise.resolve(0));

			const response = await request.post('/api/company/user')
				.send(requestBody)
				.set('authorization', accessToken)

			expect(response.status).toEqual(400)
			expect(response.body.success).toEqual(false)
			expect(response.body.data).toHaveProperty('message')
		})

		it('should not create user - unauthorized', async () => {
			const response = await request.post('/api/company/user')
				.send(requestBody)

			expect(response.status).toEqual(401)
			expect(response.body.success).toEqual(false)
			expect(response.body.data).toHaveProperty('message')
		})

		it('should not create user - has not permission', async () => {
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
