import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class CheckCronMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const headers = ctx.request.headers()
    const ua = headers['user-agent']

    if (ua !== 'CronAgent') {
      return ctx.response.unauthorized({
        status: 'error',
        message: 'Unauthorized',
      })
    }

    return await next()
  }
}
