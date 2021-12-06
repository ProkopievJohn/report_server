import { extractOmit } from '../helpers'

describe('utils : helpers', () => {
	it('should run extractOmit', async () => {
		const extracted = extractOmit({ one: 'one', two: 'two' }, ['one'])

		expect(extracted).toEqual({ two: 'two' })
	})
})
