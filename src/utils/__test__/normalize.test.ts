import { normalizeEmailAddress, normalizeName } from '../normalize'

describe('utils : normalize', () => {
	it('should run normalizeEmailAddress success', async () => {
		const email = normalizeEmailAddress('   soMEemAil123@mAil.ma   ')

		expect(email).toEqual('someemail123@mail.ma')
	})
	it('should run normalizeName success', async () => {
		const name = normalizeName('    soMe Name   ')

		expect(name).toEqual('soMe Name')
	})
})
