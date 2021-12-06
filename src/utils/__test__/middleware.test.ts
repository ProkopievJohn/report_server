import { createMockContext } from '@shopify/jest-koa-mocks'
import { ParameterizedContext, DefaultContext, DefaultState } from 'koa'
import { ObjectId } from 'mongodb'
import { isAuthenticated } from '../middleware'
import { ResponseBodyType } from '../responseHelpers'

describe('utils : middleware', () => {
	const objectId = new ObjectId()
	const nextMock = jest.fn()

	it('should run isAuthenticated success', async () => {
		const ctx = createMockContext({
			state: {
				user: {
					_id: objectId.toString(),
					companyId: objectId.toString(),
				},
			},
		})
		isAuthenticated(ctx, nextMock)

		expect(nextMock).toHaveBeenCalled()
	})
	it('should run isAuthenticated failed - do not have _id field', async () => {
		const ctx = createMockContext({
			state: {
				user: {
					companyId: objectId.toString(),
				},
			},
		})
		isAuthenticated(ctx, nextMock)

		const changedCtx = ctx as ParameterizedContext<DefaultState, DefaultContext, ResponseBodyType>

		expect(changedCtx.status).toEqual(401)
		expect(changedCtx.body).toHaveProperty('data')
		expect(changedCtx.body.code).toEqual(401)
		expect(changedCtx.body.data).toHaveProperty('message')
		expect(changedCtx.body.success).toEqual(false)
	})
})
