import { ObjectId } from 'mongodb'
import { generateModifiedValue } from '../models'

describe('utils : models', () => {
	it('should run generateModifiedValue', async () => {
		const date = new Date()
		const first = {
			_id: new ObjectId(),
			createdAt: new Date(),
			updatedAt: new Date(),
			history: [{
				action: 'created',
				createdAt: new Date(),
				modifiedValue: {},
			}],
			removedField: 'removedField',
			nullField: 'nullField',
			changedString: 'string',
			changedObject: {
				field1: 'field1',
				chngedField: 'string',
			},
			changedArray: ['str1', 'str2'],
			changedArrayOfObjects: [{
				field: 1,
				obj: {
					field: 1,
				},
				arr: [1],
			}, {
				field: 2,
				obj: {
					field: 2,
				},
				arr: [2],
			}],
			date: new Date('August 19, 1975 23:15:30'),
		}
		const second = {
			removedField: undefined,
			nullField: null,
			changedString: 'changedString',
			changedObject: {
				field1: 'field1',
				chngedField: 'chngedField',
			},
			changedArray: ['str1', 'str3'],
			changedArrayOfObjects: [{
				field: 1,
				obj: {
					field: 1,
				},
				arr: [1],
			}, {
				field: 2,
				obj: {
					field: 2,
				},
				arr: [3],
			}],
			date,
			newField: 'some data',
			newEmptyArray: [],
		}

		expect(generateModifiedValue(first, second)).toEqual({
			nullField: null,
			changedString: 'changedString',
			changedObject: {
				field1: 'field1',
				chngedField: 'chngedField',
			},
			changedArray: {
				new: ['str3'],
				prev: ['str2'],
			},
			changedArrayOfObjects: {
				new: [{ field: 2, obj: { field: 2 }, arr: [3] }],
				prev: [{ field: 2, obj: { field: 2 }, arr: [2] }],
			},
			date,
			newField: 'some data',
		})
	})
})
