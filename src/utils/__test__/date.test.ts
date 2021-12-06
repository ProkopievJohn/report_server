import { normalizeDate, startOfDay, isSameOrAfter, isAfter, isInRangeWithSame } from '../date'

describe('utils : date', () => {
	it('should run normalizeDate', async () => {
		const date = new Date()

		expect(normalizeDate(date)).toEqual(date)
		expect(normalizeDate(date.toISOString())).toEqual(date)
	})
	it('should run startOfDay', async () => {
		const date = new Date('2021-09-15T10:10:10.000Z')

		expect(startOfDay(date)).toEqual(new Date('2021-09-15T00:00:00.000Z'))
	})
	it('should run isSameOrAfter', async () => {
		const from = new Date('2021-09-15T10:10:10.000Z')
		const to = new Date('2021-09-16T10:10:10.000Z')

		expect(isSameOrAfter(from, to)).toEqual(false)
		expect(isSameOrAfter(from, from)).toEqual(true)
		expect(isSameOrAfter(to, from)).toEqual(true)
	})
	it('should run isSameOrAfter', async () => {
		const from = new Date('2021-09-15T10:10:10.000Z')
		const to = new Date('2021-09-16T10:10:10.000Z')

		expect(isAfter(from, to)).toEqual(false)
		expect(isAfter(from, from)).toEqual(false)
		expect(isAfter(to, from)).toEqual(true)
	})
	it('should run isInRangeWithSame', async () => {
		const from = new Date('2021-09-15T10:10:10.000Z')
		const to = new Date('2021-09-17T10:10:10.000Z')
		const dates = [
			new Date('2021-09-15T10:10:10.000Z'),
			new Date('2021-09-16T10:10:10.000Z'),
			new Date('2021-09-17T10:10:10.000Z'),
		]
		const fromDates = [
			new Date('2021-09-14T10:10:10.000Z'),
			new Date('2021-09-15T10:10:10.000Z'),
			new Date('2021-09-16T10:10:10.000Z'),
			new Date('2021-09-17T10:10:10.000Z'),
		]
		const toDates = [
			new Date('2021-09-15T10:10:10.000Z'),
			new Date('2021-09-16T10:10:10.000Z'),
			new Date('2021-09-17T10:10:10.000Z'),
			new Date('2021-09-18T10:10:10.000Z'),
		]

		expect(isInRangeWithSame(from, to, dates)).toEqual(true)
		expect(isInRangeWithSame(from, to, fromDates)).toEqual(false)
		expect(isInRangeWithSame(from, to, toDates)).toEqual(false)
	})
})
