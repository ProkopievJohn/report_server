import cluster from 'cluster'
import { createServer, Server } from 'http'
import Koa from 'koa'
import config from '../config'
import configureApi from './api'
import { connectToDb, setupDb } from './models'

function padRight(text: string, neededLength: number): string {
	if (text.length === neededLength) {
		return text
	} else {
		return text + (new Array(neededLength - text.length + 1).join(' '))
	}
}

export async function boot(): Promise<Server> {
	if (config.env !== 'test') {
		// eslint-disable-next-line no-console
		console.info(
			`
				+-------------------------------------------------------------+
				|                      Report API Server                      |
				+-------------------------------------------------------------+
				| Worker #${padRight(cluster.worker.id + ' is started', 51)} |
				| Port:            ${padRight(config.port + '', 42)} |
				+-------------------------------------------------------------+
			`,
		)

		await connectToDb()
		await setupDb()
	}

	const api: Koa = configureApi()
	const server: Server = createServer(api.callback())

	return server
}

export async function configureServer(): Promise<void> {
	const server: Server = await boot()

	server.listen(
		{
			host: config.host,
			port: config.port,
		},
		() => {
			// eslint-disable-next-line no-console
			console.info(`[INFO] server start on http://${config.host}:${config.port}`)
		},
	)
	// eslint-disable-next-line no-console
	server.addListener('error', err => console.error(`[ERROR] Unable to start server on port ${config.port}`, err))
}
