import Router from 'koa-router'
import { EUserRoles } from 'src/constants'
import { hasRole } from 'src/utils/middleware'
import add from './add'

export default (): [Router.IMiddleware, Router.IMiddleware] => {
	const router = new Router({
		prefix: '/project',
	})

	router.use(hasRole(EUserRoles.ADMIN))
	router.post('/', add)

	return [router.routes(), router.allowedMethods()]
}
