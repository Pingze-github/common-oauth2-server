const Router = require('koa-router');
const User = require('../entities/User');

module.exports = ApiRouter;

function ApiRouter(app, options = {}) {
  options = Object.assign({ prefix: '' }, options);

  const apiRouter = new Router({ prefix: options.prefix });


  const { oauth } = app;

  apiRouter.get('/user/*', oauth.authenticate({ scope: 'user_info:read' }));
  apiRouter.post('/user/*', oauth.authenticate({ scope: 'user_info:write' }));

  apiRouter.all('/*', async (ctx, next) => {
    const oauthState = ctx.state.oauth || {};

    if (oauthState.error) {
      // handle the error thrown by the oauth.authenticate middleware here
      ctx.throw(oauthState.error);
      return;
    }

    if (oauthState.token) {
      // this means that the access token brought by the request is authenticated
      // for convinience, we put the user associated with the token in ctx.state.user
      ctx.state.user = oauthState.token.user;// => { username: 'the-username' }

      await next();
      return;
    }

    // should not reach here at all
    ctx.throw(new Error('route without authentication'));
  });

  /**
     * OAuth Protected API: use to get the user info, in scope 'user_info:read'
     */
  apiRouter.get('/user/detail', async (ctx, next) => {
    const { user } = ctx.state;

    const detail = User.get(user.username);

    delete detail.password;

    // respond with the user's detail information
    ctx.body = detail;
  });

  return apiRouter;
}
