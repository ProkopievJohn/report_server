import { Collection, Filter, ObjectId, Document, FindOneAndUpdateOptions } from 'mongodb'
import {
	IsNotEmpty,
	IsEnum,
	IsString,
	IsOptional,
	IsDate,
	IsArray,
	ValidateNested,
	IsInt,
	IsNumber,
	IsPositive,
	Min,
	Max,
} from 'class-validator'
import { db } from '.'
import { EProjectStatuses, EHistoryActions } from '../constants'
import { ExtractAutoGeneratedType, generateModifiedValue, validateModel } from '../utils/models'
import { ICollection, ICollectionState, IHistory } from './types'
import { CustomIsMongoId } from 'src/utils/validator'

export class IProjectAbility {
	@IsNotEmpty()
	@CustomIsMongoId()
	abilityId: ObjectId

	@IsNotEmpty()
	@IsInt()
	@IsPositive()
	@Min(1)
	@Max(8)
	hours: number

	@IsNotEmpty()
	@IsNumber()
	@Min(0)
	rate: number

	@IsNotEmpty()
	@IsDate()
	since: Date

	@IsNotEmpty()
	@IsDate()
	to: Date
}

// tslint:disable-next-line: max-classes-per-file
export class IProject extends ICollectionState {
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
	@CustomIsMongoId()
	creatorId: ObjectId

	@IsNotEmpty()
	@IsEnum(EProjectStatuses)
	status: EProjectStatuses

	@IsNotEmpty()
	@IsDate()
	since: Date

	@IsNotEmpty()
	@IsDate()
	to: Date

	@IsNotEmpty()
	@IsArray()
	@ValidateNested({ each: true })
	abilities: IProjectAbility[]
}

export const collectionProjectName = 'projects'

export async function initProjectCollection(): Promise<void> {
	// const collection: Collection<IProject> = db.collection(collectionProjectName)
	// collection.createIndex({ name: 1 }, { unique: true })
}

export const ProjectCollection: ICollection<IProject> = {
	async find(query: Filter<IProject>): Promise<IProject[]> {
		const collection: Collection<IProject> = db.collection(collectionProjectName)
		return collection.find({
			$and: [
				query,
				{ status: { $ne: EProjectStatuses.DELETED } },
			],
		}).toArray()
	},

	async findOne(query: Filter<IProject>): Promise<IProject> {
		const collection: Collection<IProject> = db.collection(collectionProjectName)
		return collection.findOne({
			$and: [
				query,
				{ status: { $ne: EProjectStatuses.DELETED } },
			],
		})
	},

	async aggregate(pipeline: Document[]): Promise<IProject[]> {
		const collection: Collection<IProject> = db.collection(collectionProjectName)
		return collection.aggregate(pipeline).toArray()
	},

	async insertOne(doc: ExtractAutoGeneratedType<IProject>): Promise<IProject> {
		const history: IHistory = {
			createdAt: new Date(),
			action: EHistoryActions.CREATED,
			modifiedValues: generateModifiedValue({}, doc),
		}
		const newDoc: IProject = {
			...doc,
			createdAt: new Date(),
			updatedAt: new Date(),
			history: [history],
		}
		await validateModel(IProject, newDoc)

		const collection: Collection<IProject> = db.collection(collectionProjectName)
		return await collection.findOne({ _id: (await collection.insertOne(newDoc)).insertedId })
	},

	async insertMany(docs: ExtractAutoGeneratedType<IProject>[]): Promise<IProject[]> {
		const newDocs: IProject[] = docs.map((doc: ExtractAutoGeneratedType<IProject>): IProject => {
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

		await Promise.all(newDocs.map(async (newDoc: IProject) => validateModel(IProject, newDoc)))

		const collection: Collection<IProject> = db.collection(collectionProjectName)
		return await collection.find({
			...(await (collection.insertMany(newDocs))).insertedIds,
		}).toArray()
	},

	async update(doc: ExtractAutoGeneratedType<IProject>, options?: FindOneAndUpdateOptions): Promise<IProject> {
		const oldDoc = await this.findOne({ _id: doc._id })

		const history: IHistory = {
			createdAt: new Date(),
			action: EHistoryActions.MODIFIED,
			modifiedValues: generateModifiedValue(oldDoc, doc),
		}

		const newDoc: IProject = {
			...doc,
			createdAt: new Date(),
			updatedAt: new Date(),
			history: [...oldDoc.history, history],
		}
		await validateModel(IProject, newDoc)

		const collection: Collection<IProject> = db.collection(collectionProjectName)
		return (await collection.findOneAndUpdate(
			{
				_id: doc._id,
				status: { $ne: EProjectStatuses.DELETED },
			},
			{ $set: newDoc },
			{
				returnDocument: 'after',
				...(options || {}),
			},
		)).value
	},

	async remove(query: Filter<IProject>): Promise<void> {
		const oldDoc = await this.findOne(query)

		const history: IHistory = {
			createdAt: new Date(),
			action: EHistoryActions.DELETED,
			modifiedValues: {
				status: EProjectStatuses.DELETED,
			},
		}
		const collection: Collection<IProject> = db.collection(collectionProjectName)
		await collection.updateOne(
			query,
			{
				$set: {
					name: `${oldDoc.name} - ${oldDoc._id.toString()}`,
					status: EProjectStatuses.DELETED,
					updatedAt: new Date(),
					history: [...oldDoc.history, history],
				},
			},
		)
	},

	async count(query: Filter<IProject>): Promise<number> {
		const collection: Collection<IProject> = db.collection(collectionProjectName)
		return await collection.countDocuments({
			$and: [
				query,
				{ status: { $ne: EProjectStatuses.DELETED } },
			],
		})
	},
}
