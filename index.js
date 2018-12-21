const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const session = require('koa-session');

const oauthRouter = require('./routers/oauth-router');
const apiRouter = require('./routers/api-router');

const port = 3002;

const app = new Koa();

app.keys = ['just-a-key'];

app.use(bodyParser());
app.use(session(app));

// needed by authenticateHandler, see oauth-router
app.use(async (ctx, next) => {
  ctx.request.session = ctx.session;
  await next();
});

app.use(oauthRouter(app, { prefix: '/oauth' }).routes());
app.use(apiRouter(app, { prefix: '/api' }).routes());

app.listen(port, () => {
  console.log(`Common OAuth2 Server listening on port ${port}`);
});
