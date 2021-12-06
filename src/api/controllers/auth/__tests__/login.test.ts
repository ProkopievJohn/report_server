import { ObjectId } from 'mongodb'
import bcrypt from 'bcrypt'
import { IUser, UserCollection } from 'src/models/user'
import { boot } from 'src/server'
import { agent } from 'supertest'
import { ECompanyStatuses, EUserRoles, EUserStatuses } from 'src/constants'
import { CompanyCollection, ICompany } from 'src/models/company'

process.env.NODE_ENV = 'test'

describe('package : auth', () => {
	let httpServer
	let request
	const password = 'password'
	const email = 'email@email.email'

	const company: ICompany = {
		_id: new ObjectId(),
		name: 'name',
		status: ECompanyStatuses.ACTIVE,
		history: []
	}
	const user: IUser = {
		_id: new ObjectId(),
		name: 'name',
		surname: 'surname',
		email: 'email@email.email',
		password: bcrypt.hashSync(password, 10),
		rate: 0,
		emailVerified: true,
		companyId: company._id,
		role: EUserRoles.USER,
		status: EUserStatuses.ACTIVE,
		abilities: [new ObjectId()],
		history: []
	}

	beforeAll(async () => {
		httpServer = (await boot()).listen()
		request = agent(httpServer)
	})

	describe('POST /api/auth/login', () => {
		it('should login user', async () => {
			jest
				.spyOn(UserCollection, 'findOne')
				.mockReturnValue(Promise.resolve(user));
			jest
				.spyOn(CompanyCollection, 'findOne')
				.mockReturnValue(Promise.resolve(company));

			const response = await request.post('/api/auth/login').send({
				email,
				password,
			})

			expect(response.status).toEqual(200)
			expect(response.body.success).toEqual(true)
			expect(response.body.data).toHaveProperty('user')
			expect(response.body.data).toHaveProperty('company')
			expect(response.body.data).toHaveProperty('accessToken')
			expect(response.body.data.user.password).toBeUndefined()
		})

		it('should not login user - wrong email', async () => {
			jest
				.spyOn(UserCollection, 'findOne')
				.mockReturnValue(Promise.resolve(undefined));

			const response = await request.post('/api/auth/login').send({
				email,
				password,
			})

			expect(response.status).toEqual(400)
			expect(response.body.success).toEqual(false)
			expect(response.body.data).toHaveProperty('message')
		})

		it('should not login user - wrong password', async () => {
			jest
				.spyOn(UserCollection, 'findOne')
				.mockReturnValue(Promise.resolve(user));

			const response = await request.post('/api/auth/login').send({
				email,
				password: 'wrongpassword',
			})

			expect(response.status).toEqual(400)
			expect(response.body.success).toEqual(false)
			expect(response.body.data).toHaveProperty('message')
		})

		it('should not login user - email not verified', async () => {
			jest
				.spyOn(UserCollection, 'findOne')
				.mockReturnValue(Promise.resolve({ ...user, emailVerified: false }));

			const response = await request.post('/api/auth/login').send({
				email,
				password,
			})

			expect(response.status).toEqual(409)
			expect(response.body.success).toEqual(false)
			expect(response.body.data).toHaveProperty('message')
		})

		it('should not login user - user deleted', async () => {
			jest
				.spyOn(UserCollection, 'findOne')
				.mockReturnValue(Promise.resolve({ ...user, status: EUserStatuses.DELETED }));

			const response = await request.post('/api/auth/login').send({
				email,
				password,
			})

			expect(response.status).toEqual(409)
			expect(response.body.success).toEqual(false)
			expect(response.body.data).toHaveProperty('message')
		})

		it('should not login user - wrong fields', async () => {
			const response = await request.post('/api/auth/login').send({
				email: 'not walid email',
			})

			expect(response.status).toEqual(400)
			expect(response.body.success).toEqual(false)
			expect(response.body.data).toHaveProperty('message')
			expect(response.body.data).toHaveProperty('fields')
		})
	})

	afterAll(done => {
		httpServer.close()
		jest.resetModules()
		done()
	})
})
