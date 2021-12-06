import { IsEmail, IsNotEmpty, IsString } from 'class-validator'
import { ObjectId } from 'mongodb'
import { CustomIsMongoId, IsNonPrimitiveArray, validateAndConvert, ValidateResponse } from '../validator'

describe('utils : validator', () => {
	class ClassSubRequest {
		@IsNotEmpty()
		@IsString()
		field: string
	}

	class ClassRequest {
		@IsNotEmpty()
		@IsString()
		@IsEmail()
		email: string
	
		@IsNotEmpty()
		@CustomIsMongoId()
		objectId: ObjectId

		@IsNonPrimitiveArray(ClassSubRequest)
		array: ClassSubRequest[]
	}

	it('should run validateAndConvert success - return false', async () => {
		const validator: boolean | ValidateResponse = await validateAndConvert(ClassRequest, {
			email: 'some@mail.me',
			objectId: new ObjectId(),
			array: [{ field: 'field' }]
		})

		expect(validator).toEqual(false)
	})
	it('should run validateAndConvert failed - empty field', async () => {
		const validator: boolean | ValidateResponse = await validateAndConvert(ClassRequest, {
			objectId: new ObjectId(),
			array: [{ field: 'field' }]
		})

		expect(validator).toHaveProperty('message')
		expect(validator).toHaveProperty('fields')
		expect((validator as ValidateResponse).fields).toHaveProperty('email')
	})
	it('should run validateAndConvert failed - wrong field type', async () => {
		const validator: boolean | ValidateResponse = await validateAndConvert(ClassRequest, {
			email: 'some@mail.me',
			objectId: 'wrong id',
			array: [{ field: 'field' }]
		})

		expect(validator).toHaveProperty('message')
		expect(validator).toHaveProperty('fields')
		expect((validator as ValidateResponse).fields).toHaveProperty('objectId')
	})
	it('should run validateAndConvert failed - wrong array field', async () => {
		const validator: boolean | ValidateResponse = await validateAndConvert(ClassRequest, {
			email: 'some@mail.me',
			objectId: 'wrong id',
			array: [{ field: 123 }]
		})

		expect(validator).toHaveProperty('message')
		expect(validator).toHaveProperty('fields')
		expect((validator as ValidateResponse).fields).toHaveProperty('array')
	})
})
