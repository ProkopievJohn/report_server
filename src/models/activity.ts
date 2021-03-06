import { Collection, Filter, ObjectId, Document, FindOneAndUpdateOptions } from 'mongodb'
import {
	IsNotEmpty,
	IsEnum,
	IsDate,
} from 'class-validator'
import { db } from '.'
import { EActivityStatuses, EHistoryActions } from '../constants'
import { ExtractAutoGeneratedType, generateModifiedValue, validateModel } from '../utils/models'
import { ICollection, ICollectionState, IHistory } from './types'
import { CustomIsMongoId } from 'src/utils/validator'

export class IActivity extends ICollectionState {
	@IsNotEmpty()
	@CustomIsMongoId()
	companyId: ObjectId

	@IsNotEmpty()
	@CustomIsMongoId()
	creatorId: ObjectId

	@IsNotEmpty()
	@CustomIsMongoId()
	projectId: ObjectId

	@IsNotEmpty()
	@CustomIsMongoId()
	userId: ObjectId

	@IsNotEmpty()
	@CustomIsMongoId()
	abilityId: ObjectId

	@IsNotEmpty()
	@IsEnum(EActivityStatuses)
	status: EActivityStatuses

	@IsNotEmpty()
	@IsDate()
	since: Date

	@IsNotEmpty()
	@IsDate()
	to: Date
}

export const collectionActivityName = 'activities'

// eslint-disable-next-line @typescript-eslint/no-empty-function
export async function initActivityCollection(): Promise<void> {}

export const ActivityCollection: ICollection<IActivity> = {
	async find(query: Filter<IActivity>): Promise<IActivity[]> {
		const collection: Collection<IActivity> = db.collection(collectionActivityName)
		return collection.find({
			$and: [
				query,
				{ status: { $ne: EActivityStatuses.DELETED } },
			],
		}).toArray()
	},

	async findOne(query: Filter<IActivity>): Promise<IActivity> {
		const collection: Collection<IActivity> = db.collection(collectionActivityName)
		return collection.findOne({
			$and: [
				query,
				{ status: { $ne: EActivityStatuses.DELETED } },
			],
		})
	},

	async aggregate(pipeline: Document[]): Promise<IActivity[]> {
		const collection: Collection<IActivity> = db.collection(collectionActivityName)
		return collection.aggregate(pipeline).toArray()
	},

	async insertOne(doc: ExtractAutoGeneratedType<IActivity>): Promise<IActivity> {
		const history: IHistory = {
			createdAt: new Date(),
			action: EHistoryActions.CREATED,
			modifiedValues: generateModifiedValue({}, doc),
		}
		const newDoc: IActivity = {
			...doc,
			createdAt: new Date(),
			updatedAt: new Date(),
			history: [history],
		}
		await validateModel(IActivity, newDoc)

		const collection: Collection<IActivity> = db.collection(collectionActivityName)
		return await collection.findOne({ _id: (await collection.insertOne(newDoc)).insertedId })
	},

	async insertMany(docs: ExtractAutoGeneratedType<IActivity>[]): Promise<IActivity[]> {
		const newDocs: IActivity[] = docs.map((doc: ExtractAutoGeneratedType<IActivity>): IActivity => {
			const history: IHistory = {
				createdAt: new Date(),
				action: EHistoryActions.CREATED,
				modifiedValues: generateModifiedValue({}, doc),
			}
			return {
				...doc,
				createdAt: new Date(),
				updatedAt: new Date(),
				history: [history],
			}
		})

		await Promise.all(newDocs.map(async (newDoc: IActivity) => validateModel(IActivity, newDoc)))

		const collection: Collection<IActivity> = db.collection(collectionActivityName)
		return await collection.find({
			...(await (collection.insertMany(newDocs))).insertedIds,
		}).toArray()
	},

	async update(doc: ExtractAutoGeneratedType<IActivity>, options?: FindOneAndUpdateOptions): Promise<IActivity> {
		const oldDoc = await this.findOne({ _id: doc._id })

		const history: IHistory = {
			createdAt: new Date(),
			action: EHistoryActions.MODIFIED,
			modifiedValues: generateModifiedValue(oldDoc, doc),
		}

		const newDoc: IActivity = {
			...doc,
			createdAt: new Date(),
			updatedAt: new Date(),
			history: [...oldDoc.history, history],
		}
		await validateModel(IActivity, newDoc)

		const collection: Collection<IActivity> = db.collection(collectionActivityName)
		return (await collection.findOneAndUpdate(
			{
				_id: doc._id,
				status: { $ne: EActivityStatuses.DELETED },
			},
			{ $set: newDoc },
			{
				returnDocument: 'after',
				...(options || {}),
			},
		)).value
	},

	async remove(query: Filter<IActivity>): Promise<void> {
		const oldDoc = await this.findOne(query)

		const history: IHistory = {
			createdAt: new Date(),
			action: EHistoryActions.DELETED,
			modifiedValues: {
				status: EActivityStatuses.DELETED,
			},
		}
		const collection: Collection<IActivity> = db.collection(collectionActivityName)
		await collection.updateOne(
			query,
			{
				$set: {
					name: `${oldDoc.name} - ${oldDoc._id.toString()}`,
					status: EActivityStatuses.DELETED,
					updatedAt: new Date(),
					history: [...oldDoc.history, history],
				},
			},
		)
	},

	async count(query: Filter<IActivity>): Promise<number> {
		const collection: Collection<IActivity> = db.collection(collectionActivityName)
		return await collection.countDocuments({
			$and: [
				query,
				{ status: { $ne: EActivityStatuses.DELETED } },
			],
		})
	},
}
