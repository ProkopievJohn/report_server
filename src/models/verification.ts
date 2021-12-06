import { Collection, Filter, ObjectId, Document, FindOneAndUpdateOptions } from 'mongodb'
import { IsDate, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { db } from '.'
import constants, { EVerificationsTypes } from '../constants'
import { validateModel } from '../utils/models'
import { ICollection } from './types'
import { CustomIsMongoId } from 'src/utils/validator'

export class IVerification {
	@IsOptional()
	@CustomIsMongoId()
	_id?: ObjectId

	@IsNotEmpty()
	@IsDate()
	createdAt: Date

	@IsNotEmpty()
	@IsString()
	token: string

	@IsNotEmpty()
	@IsEnum(EVerificationsTypes)
	type: EVerificationsTypes

	@IsNotEmpty()
	@CustomIsMongoId()
	creatorId: ObjectId
}

const collectionName = 'verifications'

export async function initVerificationCollection(): Promise<void> {
	const collection: Collection<IVerification> = db.collection(collectionName)
	collection.createIndex({ token: 1 }, { unique: true })
	collection.createIndex({ createdAt: 1 }, { expireAfterSeconds: constants.VERIFICATION_LIFETIME })
}

export const VerificationCollection: ICollection<IVerification> = {
	async find(query: Filter<IVerification>): Promise<IVerification[]> {
		const collection: Collection<IVerification> = db.collection(collectionName)
		return collection.find(query).toArray()
	},

	async findOne(query: Filter<IVerification>): Promise<IVerification> {
		const collection: Collection<IVerification> = db.collection(collectionName)
		return collection.findOne(query)
	},

	async aggregate(pipeline: Document[]): Promise<IVerification[]> {
		const collection: Collection<IVerification> = db.collection(collectionName)
		return collection.aggregate(pipeline).toArray()
	},

	async insertOne(doc: IVerification): Promise<IVerification> {
		await validateModel(IVerification, doc)

		const collection: Collection<IVerification> = db.collection(collectionName)
		return await collection.findOne({ _id: (await collection.insertOne(doc)).insertedId })
	},

	async insertMany(docs: IVerification[]): Promise<IVerification[]> {
		await Promise.all(docs.map(async (newDoc: IVerification) => validateModel(IVerification, newDoc)))

		const collection: Collection<IVerification> = db.collection(collectionName)
		return await collection.find({
			...(await (collection.insertMany(docs))).insertedIds,
		}).toArray()
	},

	async update(doc: IVerification, options?: FindOneAndUpdateOptions): Promise<IVerification> {
		await validateModel(IVerification, doc)

		const collection: Collection<IVerification> = db.collection(collectionName)
		return (await collection.findOneAndUpdate(
			{ _id: doc._id },
			{ $set: doc },
			{
				returnDocument: 'after',
				...(options || {}),
			},
		)).value
	},

	async remove(query: Filter<IVerification>): Promise<void> {
		const collection: Collection<IVerification> = db.collection(collectionName)
		await collection.deleteOne(query)
	},

	async count(query: Filter<IVerification>): Promise<number> {
		const collection: Collection<IVerification> = db.collection(collectionName)
		return await collection.countDocuments(query)
	},
}
