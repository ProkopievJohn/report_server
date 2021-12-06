import Router, { RouterContext } from 'koa-router'
import configureAuth from './auth'
import configureVerify from './verify'
import configureCompany from './company'
import { resolve } from 'src/utils/responseHelpers'

export default (): Router.IMiddleware => {
	const router: Router = new Router({
		prefix: '/api',
	})

	router.get('/ping', async (ctx: RouterContext<never>) => {
		resolve(ctx, { ping: 'pong' })
	})

	router.use(...configureAuth())
	router.use(...configureVerify())
	router.use(...configureCompany())

	return router.routes()
}
