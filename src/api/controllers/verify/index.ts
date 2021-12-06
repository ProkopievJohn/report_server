import Router from 'koa-router'
import verifyEmail from './email'

export default (): [Router.IMiddleware, Router.IMiddleware] => {
	const router: Router = new Router({
		prefix: '/verify',
	})

	router.get('/email/:token', verifyEmail)

	return [router.routes(), router.allowedMethods()]
}
