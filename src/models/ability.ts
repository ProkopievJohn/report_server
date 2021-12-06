import { Collection, Filter, FindOneAndUpdateOptions, Document, ObjectId } from 'mongodb'
import {
	IsNotEmpty,
	IsEnum,
	IsString,
	IsOptional,
} from 'class-validator'
import { db } from '.'
import { EAbilityStatuses, EHistoryActions } from '../constants'
import { ExtractAutoGeneratedType, generateModifiedValue, validateModel } from '../utils/models'
import { ICollection, ICollectionState, IHistory } from './types'
import { CustomIsMongoId } from 'src/utils/validator'

export class IAbility extends ICollectionState {
	@IsNotEmpty()
	@IsString()
	name: string

	@IsOptional()
	@IsString()
	description: string

	@IsNotEmpty()
	@CustomIsMongoId()
	companyId: ObjectId

	@IsNotEmpty()
	@IsEnum(EAbilityStatuses)
	status: EAbilityStatuses
}

export const collectionAbilityName = 'abilities'

// eslint-disable-next-line @typescript-eslint/no-empty-function
export async function initAbilityCollection(): Promise<void> {}

export const AbilityCollection: ICollection<IAbility> = {
	async find(query: Filter<IAbility>): Promise<IAbility[]> {
		const collection: Collection<IAbility> = db.collection(collectionAbilityName)
		return collection.find({
			$and: [
				query,
				{ status: { $ne: EAbilityStatuses.DELETED } },
			],
		}).toArray()
	},

	async findOne(query: Filter<IAbility>): Promise<IAbility> {
		const collection: Collection<IAbility> = db.collection(collectionAbilityName)
		return collection.findOne({
			$and: [
				query,
				{ status: { $ne: EAbilityStatuses.DELETED } },
			],
		})
	},

	async aggregate(pipeline: Document[]): Promise<IAbility[]> {
		const collection: Collection<IAbility> = db.collection(collectionAbilityName)
		return collection.aggregate(pipeline).toArray()
	},

	async insertOne(doc: ExtractAutoGeneratedType<IAbility>): Promise<IAbility> {
		const history: IHistory = {
			createdAt: new Date(),
			action: EHistoryActions.CREATED,
			modifiedValues: generateModifiedValue({}, doc),
		}
		const newDoc: IAbility = {
			...doc,
			createdAt: new Date(),
			updatedAt: new Date(),
			history: [history],
		}
		await validateModel(IAbility, newDoc)

		const collection: Collection<IAbility> = db.collection(collectionAbilityName)
		return await collection.findOne({ _id: (await collection.insertOne(newDoc)).insertedId })
	},

	async insertMany(docs: ExtractAutoGeneratedType<IAbility>[]): Promise<IAbility[]> {
		const newDocs: IAbility[] = docs.map((doc: ExtractAutoGeneratedType<IAbility>): IAbility => {
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

		await Promise.all(newDocs.map(async (newDoc: IAbility) => validateModel(IAbility, newDoc)))

		const collection: Collection<IAbility> = db.collection(collectionAbilityName)
		return await collection.find({
			...(await (collection.insertMany(newDocs))).insertedIds,
		}).toArray()
	},

	async update(doc: ExtractAutoGeneratedType<IAbility>, options?: FindOneAndUpdateOptions): Promise<IAbility> {
		const oldDoc = await this.findOne({ _id: doc._id })

		const history: IHistory = {
			createdAt: new Date(),
			action: EHistoryActions.MODIFIED,
			modifiedValues: generateModifiedValue(oldDoc, doc),
		}

		const newDoc: IAbility = {
			...doc,
			createdAt: new Date(),
			updatedAt: new Date(),
			history: [...oldDoc.history, history],
		}
		await validateModel(IAbility, newDoc)

		const collection: Collection<IAbility> = db.collection(collectionAbilityName)
		return (await collection.findOneAndUpdate(
			{
				_id: doc._id,
				status: { $ne: EAbilityStatuses.DELETED },
			},
			{ $set: newDoc },
			{
				returnDocument: 'after',
				...(options || {}),
			},
		)).value
	},

	async remove(query: Filter<IAbility>): Promise<void> {
		const oldDoc = await this.findOne(query)

		const history: IHistory = {
			createdAt: new Date(),
			action: EHistoryActions.DELETED,
			modifiedValues: {
				status: EAbilityStatuses.DELETED,
			},
		}
		const collection: Collection<IAbility> = db.collection(collectionAbilityName)
		await collection.updateOne(
			query,
			{
				$set: {
					name: `${oldDoc.name} - ${oldDoc._id.toString()}`,
					status: EAbilityStatuses.DELETED,
					updatedAt: new Date(),
					history: [...oldDoc.history, history],
				},
			},
		)
	},

	async count(query: Filter<IAbility>): Promise<number> {
		const collection: Collection<IAbility> = db.collection(collectionAbilityName)
		return await collection.countDocuments({
			$and: [
				query,
				{ status: { $ne: EAbilityStatuses.DELETED } },
			],
		})
	},
}