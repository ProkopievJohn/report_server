import cluster from 'cluster'
import os from 'os'
import { configureServer } from './server'
import config from '../config'
process.env.TZ = 'UTC'

if (cluster.isPrimary) {
	const cpus: number = os.cpus().length
	const countProcess: number = config.debug ? 1 : cpus

	for (let i = 0; i < countProcess; i++) {
		cluster.fork()
	}

	cluster.on('exit', (worker, code, signal) => {
		// eslint-disable-next-line no-console
		console.warn(
			'[WARN] Worker %d died with code/signal %s. Restarting worker...',
			worker.process.pid,
			signal,
			code,
		)
		cluster.fork()
	})
} else {
	configureServer()
}
