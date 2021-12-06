import moment from 'moment'

export const normalizeDate = (date: string | Date): Date => {
	return moment.utc(date).toDate()
}

export const startOfDay = (date: Date): Date => {
	return moment.utc(date).startOf('day').toDate()
}

export const endOfDay = (date: Date): Date => {
	return moment.utc(date).endOf('day').toDate()
}

export const isSameOrAfter = (from: Date, to: Date): boolean => {
	return moment.utc(from).isSameOrAfter(to)
}

export const isAfter = (from: Date, to: Date): boolean => {
	return moment.utc(from).isAfter(to)
}

export const isInRangeWithSame = (from: Date, to: Date, dates: Date[]): boolean => {
	return dates.every((date: Date) => !isAfter(from, to) && isSameOrAfter(date, from) && isSameOrAfter(to, date))
}
