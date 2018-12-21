
# Common OAuth2 Server

> A common implementation of OAuth2.0 Server (Provider), can access different account systems.

## Start Server

```
npm run start
```

## Development

Modify or extend Client/Scope/User in entities/.

## Using Storage

Implement a Store class in stores/. Then change the reference in stores/index.js.

The Store must implement these methods:
+ static async get() {}
+ static async set() {}
+ setExpiration() {}

## APIs

#### GET /oauth/authorize

The OAuth2.0 Authencode code mode's Authorize API.

#### POST /oauth/token

The OAuth2.0 Authencode code mode's Token API.

#### POST /oauth/login

Submit login.

#### GET /api/user/detail

Get user's information.

## TEST with client

Use [example in Pingze-github/common-oauth2-server](https://github.com/Pingze-github/passport-common-oauth2/tree/master/example/client) for test.

