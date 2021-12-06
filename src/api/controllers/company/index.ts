import Router from 'koa-router'
import JWT from 'koa-jwt'
import configureUser from './user'
import configureAbility from './ability'
import configureProject from './project'
import configureActivity from './activity'
import config from 'config'
import { isAuthenticated } from 'src/utils/middleware'

export default (): [Router.IMiddleware, Router.IMiddleware] => {
	const router = new Router({
		prefix: '/company',
	})

	router.use(JWT(config.jwt))
	router.use(isAuthenticated)
	router.use(...configureUser())
	router.use(...configureAbility())
	router.use(...configureProject())
	router.use(...configureActivity())

	return [router.routes(), router.allowedMethods()]
}
