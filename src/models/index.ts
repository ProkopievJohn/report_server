import { MongoClient, Db } from 'mongodb'
import config from 'config'
import { initUserCollection } from './user'
import { initCompanyCollection } from './company'
import { initVerificationCollection } from './verification'
import { initAbilityCollection } from './ability'
import { initActivityCollection } from './activity'

export async function setupDb(): Promise<void> {
	await initUserCollection()
	await initCompanyCollection()
	await initVerificationCollection()
	await initAbilityCollection()
	await initActivityCollection()
}

export let db: Db

export async function connectToDb(): Promise<void> {
	const client: MongoClient = await MongoClient.connect(config.db.uri, config.db.options)
	db = client.db(config.db.name)

	// eslint-disable-next-line no-console
	console.info('[INFO] DB is connected')
}
