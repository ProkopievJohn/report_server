import cors from '@koa/cors'
import config from 'config'
import Koa, { Context } from 'koa'
import KoaBodyParser from 'koa-body'
import { errorHandler } from 'src/utils/middleware'
import configureControllers from './controllers'

export default (): Koa => {
	const api: Koa = new Koa()

	api.use(cors())
	api.use(errorHandler)
	api.use(KoaBodyParser())

	if (config.debug && config.env !== 'test') {
		api.use(async (ctx: Context, next: () => Promise<never>) => {
			const start: number = new Date().getTime()
			await next()
			const execution: number = new Date().getTime() - start
			if (execution > 100) {
				// eslint-disable-next-line no-console
				console.warn(`[WARN] ${ctx.url} ${ctx.method} Execution ${execution}ms`)
			}
		})
	}

	api.proxy = true

	api.use(configureControllers())

	return api
}
