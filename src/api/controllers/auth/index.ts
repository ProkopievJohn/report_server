import Router from 'koa-router'
import register from './register'
import login from './login'

export default (): [Router.IMiddleware, Router.IMiddleware] => {
	const router: Router = new Router({
		prefix: '/auth',
	})

	router.post('/register', register)
	router.post('/login', login)

	return [router.routes(), router.allowedMethods()]
}
