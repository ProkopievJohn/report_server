import { ObjectId } from 'mongodb'
import { ECompanyStatuses, EUserRoles, EUserStatuses, EVerificationsTypes } from 'src/constants'
import { CompanyCollection, ICompany } from 'src/models/company'
import { IUser, UserCollection } from 'src/models/user'
import { IVerification, VerificationCollection } from 'src/models/verification'
import { boot } from 'src/server'
import { agent } from 'supertest'

process.env.NODE_ENV = 'test'

describe('package : verify', () => {
	let httpServer
	let request
	const token = 'token123token123'
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
	const company: ICompany = {
		_id: new ObjectId(),
		name: 'name',
		status: ECompanyStatuses.INACTIVE,
		history: []
	}
	const verification: IVerification = {
		createdAt: new Date(),
		creatorId: user._id,
		type: EVerificationsTypes.VERIFY_EMAIL,
		token,
	}

	beforeAll(async () => {
		httpServer = (await boot()).listen()
		request = agent(httpServer)
	})

	describe('GET /api/verify/email/:token', () => {
		it('should verify an account email for the admin', async () => {
			jest
				.spyOn(VerificationCollection, 'findOne')
				.mockReturnValue(Promise.resolve(verification));
			jest
				.spyOn(UserCollection, 'findOne')
				.mockReturnValue(Promise.resolve(user));
			jest
				.spyOn(CompanyCollection, 'findOne')
				.mockReturnValue(Promise.resolve(company));
			jest
				.spyOn(UserCollection, 'update')
				.mockReturnValue(Promise.resolve({ ...user, status: EUserStatuses.ACTIVE }));
			jest
				.spyOn(CompanyCollection, 'update')
				.mockReturnValue(Promise.resolve({ ...company, status: ECompanyStatuses.ACTIVE }));
			jest
				.spyOn(VerificationCollection, 'remove')
				.mockReturnValue(Promise.resolve());

			const response = await request.get(`/api/verify/email/${token}`)

			expect(response.status).toEqual(200)
			expect(response.body.success).toEqual(true)
			expect(response.body.data).toHaveProperty('user')
			expect(response.body.data).toHaveProperty('company')
			expect(response.body.data).toHaveProperty('accessToken')
			expect(response.body.data.user.password).toBeUndefined()
			expect(response.body.data.user.status).toEqual(EUserStatuses.ACTIVE)
			expect(response.body.data.company.status).toEqual(ECompanyStatuses.ACTIVE)
		})

		it('should verify an account email for the user', async () => {
			jest
				.spyOn(VerificationCollection, 'findOne')
				.mockReturnValue(Promise.resolve(verification));
			jest
				.spyOn(UserCollection, 'findOne')
				.mockReturnValue(Promise.resolve({ ...user, role: EUserRoles.USER }));
			jest
				.spyOn(CompanyCollection, 'findOne')
				.mockReturnValue(Promise.resolve(company));
			jest
				.spyOn(UserCollection, 'update')
				.mockReturnValue(Promise.resolve({ ...user, status: EUserStatuses.ACTIVE }));
			jest
				.spyOn(VerificationCollection, 'remove')
				.mockReturnValue(Promise.resolve());

			const response = await request.get(`/api/verify/email/${token}`)

			expect(response.status).toEqual(200)
			expect(response.body.success).toEqual(true)
			expect(response.body.data).toHaveProperty('user')
			expect(response.body.data).toHaveProperty('company')
			expect(response.body.data).toHaveProperty('accessToken')
			expect(response.body.data.user.password).toBeUndefined()
			expect(response.body.data.user.status).toEqual(EUserStatuses.ACTIVE)
			expect(response.body.data.company.status).toEqual(ECompanyStatuses.INACTIVE)
		})

		it('should not verify an account email - wrong token', async () => {
			jest
				.spyOn(VerificationCollection, 'findOne')
				.mockReturnValue(Promise.resolve(undefined));

			const response = await request.get(`/api/verify/email/${token}`)

			expect(response.status).toEqual(400)
			expect(response.body.success).toEqual(false)
			expect(response.body.data).toHaveProperty('message')
		})

		it('should not verify an account email - user not found', async () => {
			jest
				.spyOn(VerificationCollection, 'findOne')
				.mockReturnValue(Promise.resolve(verification));
			jest
				.spyOn(UserCollection, 'findOne')
				.mockReturnValue(Promise.resolve(undefined));

			const response = await request.get(`/api/verify/email/${token}`)

			expect(response.status).toEqual(404)
			expect(response.body.success).toEqual(false)
			expect(response.body.data).toHaveProperty('message')
		})

		it('should not verify an account email - company not found', async () => {
			jest
				.spyOn(VerificationCollection, 'findOne')
				.mockReturnValue(Promise.resolve(verification));
			jest
				.spyOn(UserCollection, 'findOne')
				.mockReturnValue(Promise.resolve(user));
			jest
				.spyOn(CompanyCollection, 'findOne')
				.mockReturnValue(Promise.resolve(undefined));

			const response = await request.get(`/api/verify/email/${token}`)

			expect(response.status).toEqual(404)
			expect(response.body.success).toEqual(false)
			expect(response.body.data).toHaveProperty('message')
		})

		it('should not verify an account email - email already verified', async () => {
			jest
				.spyOn(VerificationCollection, 'findOne')
				.mockReturnValue(Promise.resolve(verification));
			jest
				.spyOn(UserCollection, 'findOne')
				.mockReturnValue(Promise.resolve({ ...user, emailVerified: true }));
			jest
				.spyOn(CompanyCollection, 'findOne')
				.mockReturnValue(Promise.resolve(company));

			const response = await request.get(`/api/verify/email/${token}`)

			expect(response.status).toEqual(400)
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
