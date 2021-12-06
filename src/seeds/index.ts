import fs from 'fs'
import { connectToDb, setupDb } from '../models'

/*
	format XX_{seedName}.ts
	e.g. 01_users.ts
*/

async function executeArray(arr: string[]): Promise<void[]> {
	return Promise.all(arr.map(async file => {
		const module = await import(`./${file}`)
		await module.default()
	}))
}

async function seeds(): Promise<void> {
	await connectToDb()
	await setupDb()

	const filesArrays: string[][] = await new Promise((resolve, reject) => {
		fs.readdir('src/seeds', (err, files: string[]): void => {
			if (err) {
				reject(err)
			}
			const arrOfArr = files.filter(f => f !== 'index.ts').reduce(
				(acc: string[][], file: string): string[][] => {
					const index = Number(file.split('_')[0])
					if (!acc[index]) {
						acc[index] = []
					}
					acc[index].push(file)
					return acc
				},
				[[]],
			)
			resolve(arrOfArr)
		})
	})
	for (const filesArray of filesArrays) {
		try {
			await executeArray(filesArray)
		} catch (err) {
			// eslint-disable-next-line no-console
			console.error('[ERROR]', err)
			break
		}
	}

	process.exit(0)
}

try {
	seeds()
} catch (err) {
	// eslint-disable-next-line no-console
	console.error('[ERROR]', err)
	process.exit()
}
