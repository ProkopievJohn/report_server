import { agent } from 'supertest'
import { ObjectId } from 'mongodb'
import { CompanyCollection, ICompany } from 'src/models/company'
import { IUser, UserCollection } from 'src/models/user'
import { IVerification, VerificationCollection } from 'src/models/verification'
import { ECompanyStatuses, EUserRoles, EUserStatuses, EVerificationsTypes } from 'src/constants'
import { boot } from 'src/server'

process.env.NODE_ENV = 'test'

describe('package : auth', () => {
	let httpServer
	let request
	const user: IUser = {
		_id: new ObjectId(),
		name: 'name',
		surname: 'surname',
		email: 'email@email.email',
		password: 'password',
		rate: 0,
		emailVerified: true,
		companyId: new ObjectId(),
		role: EUserRoles.USER,
		status: EUserStatuses.ACTIVE,
		abilities: [new ObjectId()],
		history: []
	}
	const company: ICompany = {
		_id: new ObjectId(),
		name: 'name',
		status: ECompanyStatuses.ACTIVE,
		history: []
	}
	const verification: IVerification = {
		createdAt: new Date(),
		creatorId: user._id,
		type: EVerificationsTypes.VERIFY_EMAIL,
		token: 'token',
	}

	const requestBody = {
		email: 'email2@email.email',
		companyName: 'companyName',
		name: 'name',
		surname: 'surname',
		password: 'password',
	}

	beforeAll(async () => {
		httpServer = (await boot()).listen()
		request = agent(httpServer)
	})

	describe('POST /api/auth/register', () => {
		it('should create an account and company for the user', async () => {
			jest
				.spyOn(UserCollection, 'findOne')
				.mockReturnValue(Promise.resolve(undefined));
			jest
				.spyOn(CompanyCollection, 'findOne')
				.mockReturnValue(Promise.resolve(undefined));
			jest
				.spyOn(UserCollection, 'insertOne')
				.mockReturnValue(Promise.resolve(user));
			jest
				.spyOn(CompanyCollection, 'insertOne')
				.mockReturnValue(Promise.resolve(company));
			jest
				.spyOn(VerificationCollection, 'insertOne')
				.mockReturnValue(Promise.resolve(verification));

			const response = await request.post('/api/auth/register')
				.send(requestBody)

			expect(response.status).toEqual(200)
			expect(response.body.success).toEqual(true)
			expect(response.body.data).toHaveProperty('user')
			expect(response.body.data).toHaveProperty('company')
			expect(response.body.data.user.password).toBeUndefined()
		})

		it('should not create an account - email already exist', async () => {
			jest
				.spyOn(UserCollection, 'findOne')
				.mockReturnValue(Promise.resolve(user));

			const response = await request.post('/api/auth/register')
				.send(requestBody)

			expect(response.status).toEqual(409)
			expect(response.body.success).toEqual(false)
			expect(response.body.data).toHaveProperty('message')
		})

		it('should not create an account - company name already exist', async () => {
			jest
				.spyOn(UserCollection, 'findOne')
				.mockReturnValue(Promise.resolve(undefined));
			jest
				.spyOn(CompanyCollection, 'findOne')
				.mockReturnValue(Promise.resolve(company));

			const response = await request.post('/api/auth/register')
				.send(requestBody)

			expect(response.status).toEqual(409)
			expect(response.body.success).toEqual(false)
			expect(response.body.data).toHaveProperty('message')
		})

		it('should not create an account - wrong fields', async () => {
			const response = await request.post('/api/auth/register')
				.send({
					email: 'email',
					companyName: 'companyName',
					name: 'name',
					password: 'password',
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
