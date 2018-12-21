const OauthServer = require('koa2-oauth-server');
const Router = require('koa-router');
const consolidate = require('consolidate');
const path = require('path');

const Store = require('../stores');
const User = require('../entities/User');
const Client = require('../entities/Client');
const Scope = require('../entities/Scope');
const oauthModel = require('../model/model');

const CSRF_TOKEN_EXPIRES_IN = 1000 * 60 * 2;// 2 minutes

const templateConfig = {
  basePath: path.resolve(`${__dirname}/../views`),
  ext: 'html',
  engine: 'lodash',
};

module.exports = getOauthRouter;

function getOauthRouter(app, options = {}) {
  const oauthRouter = new Router({ prefix: options.prefix });

  app.oauth = new OauthServer({
    model: oauthModel({
      // in this example, we use runtime-memory-backed storage for oauth codes and tokens. we can alternatively use redis or mongodb, etc.
      authorizationCodeStore: new Store(),
      accessTokenStore: new Store(),
      refreshTokenStore: new Store(),
      clientRegistry: Client,
    }),
    useErrorHandler: true,
  });

  oauthRouter.post('/login', login);

  // check if the user has logged, if not, redirect to login page, otherwise redirect to the authorization confirm page
  oauthRouter.get('/authorize', checkLogin);

  // define the authorize endpoint, in this example, we implement only the most commonly used authorization type: authorization code
  oauthRouter.get('/authorize', app.oauth.authorize({

    // implement a handle(request, response):user method to get the authenticated user (aka. the logged-in user)
    // Note: this is where the node-oauth2-server get to know what the currently logined-in user is.
    authenticateHandler: authenticateHandler(),
  }));

  // define the token endpoint, in this example, we implement two token grant types: 'code' and 'refresh_token'
  oauthRouter.post('/token', app.oauth.token());

  // error handler
  oauthRouter.all('/*', async (ctx, next) => {
    const oauthState = ctx.state.oauth || {};

    if (oauthState.error) {
      // handle the error thrown by the oauth.authenticate middleware here
      ctx.throw(oauthState.error);
      return;
    }

    await next();
  });

  return oauthRouter;
}

function authenticateHandler() {
  return {
    handle(request, response) {
      // in this example, we store the logged-in user as the 'loginUser' attribute in session
      if (request.session.loginUser) {
        return { username: request.session.loginUser.username };
      }

      return null;
    },
  };
}

async function forwardToLogin(ctx, callbackUri) {
  await forwardToView(ctx, 'login', {
    // when logged in successfully, redirect back to the original request url
    callbackUri: Buffer.from(callbackUri, 'utf-8').toString('base64'),
    loginUrl: '/oauth/login',
  });
}

async function forwardToView(ctx, viewName, viewModel) {
  const viewPath = path.resolve(`${templateConfig.basePath}`, `${viewName}.${templateConfig.ext}`);


  const renderer = consolidate[templateConfig.engine];

  if (!renderer) {
    throw new Error(`template engine ${templateConfig.engine} is unsupported`);
  }

  ctx.body = await renderer(viewPath, viewModel);
}

function getRequestUrl(ctx) {
  return `${ctx.href}`;
}

function removeUserAction(url) {
  return url.replace(/&?(deny|agree|logout|csrfToken)=[^&]+/g, '');
}

/**
 * @param {Date} time
 * @return {Boolean}
 */
function isExpired(time) {
  return Date.now() >= time;
}

async function checkLogin(ctx, next) {
  const agree = ctx.query.agree === 'true';


  const deny = ctx.query.deny === 'true';


  const logout = ctx.query.logout === 'true';


  const clientId = ctx.query.client_id;


  const { csrfToken, scope } = ctx.query;


  const { loginUser } = ctx.session;


  let sessCsrfToken = ctx.session.userConfirmCsrfToken;

  // scope = 'authorization_code';

  if (!clientId || !scope) {
    return ctx.status = 400;
  }

  const client = Client.get(clientId);
  // in this example, we simply filter out those scopes that are not valid
  const scopes = scope.split(',').map(s => Scope.get(s)).filter(Boolean);

  if (!client) {
    return ctx.status = 401;
  }

  const curRequestUrl = removeUserAction(getRequestUrl(ctx));

  if (!loginUser) {
    return await forwardToLogin(ctx, curRequestUrl);
  }

  if (csrfToken && sessCsrfToken
    && sessCsrfToken.token === csrfToken
    && !isExpired(sessCsrfToken.expiresAt)
    && (agree || deny || logout)) {
    if (deny) {
      await forwardToView(ctx, 'user-denied', {
        clientName: client.name,
        username: loginUser.username,
      });
    } else if (logout) {
      ctx.session.loginUser = null;
      return await forwardToLogin(ctx, curRequestUrl);
    } else {
      await next();
    }
    return null;
  }

  sessCsrfToken = {
    token: `csrf-${Math.floor(Math.random() * 100000000)}`,
    expiresAt: Date.now() + CSRF_TOKEN_EXPIRES_IN,
  };

  ctx.session.userConfirmCsrfToken = sessCsrfToken;

  await forwardToView(ctx, 'user-confirm', {
    oauthUri: curRequestUrl,
    csrfToken: sessCsrfToken.token,
    clientName: client.name,
    username: loginUser.username,
    scopes,
  });
}

async function login(ctx, next) {
  let callbackUri = ctx.request.body.callback_uri;
  const { username, password } = ctx.request.body;

  if (!callbackUri || !username || !password) {
    return ctx.status = 400;
  }

  callbackUri = Buffer.from(callbackUri, 'base64').toString('utf-8');

  if (!User.verify(username, password)) {
    await forwardToLogin(ctx, callbackUri);
    return null;
  }

  // login successfully

  ctx.session.loginUser = { username };

  ctx.redirect(callbackUri);
}
