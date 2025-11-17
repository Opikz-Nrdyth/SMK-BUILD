export default class CheckCronMiddleware {
    async handle(ctx, next) {
        const headers = ctx.request.headers();
        const ua = headers['user-agent'];
        if (ua !== 'CronAgent') {
            return ctx.response.unauthorized({
                status: 'error',
                message: 'Unauthorized',
            });
        }
        return await next();
    }
}
//# sourceMappingURL=check_cron_middleware.js.map