const MemoryStorage = require('simple-memory-storage');

const db = new MemoryStorage();

// Implement your Entity here
class Client {
  static set(id, client) {
    return db.set(id, client);
  }

  static get(id) {
    return db.get(id);
  }
}

// pre-store for the example
Client.set('sample_app', {
  id: 'sample_app',
  clientSecret: 'this_is_the_client_secret',
  name: 'Sample App', // custom field
  scope: 'user_info:read', // a custom scope, indicating that this client is allowed to be authorized to read the user's information
  grants: ['authorization_code', 'refresh_token'],
  redirectUris: ['http://127.0.0.1:3001/auth/common/callback'],
  accessTokenLifetime: 7200, // not required, default is 3600,
  refreshTokenLifetime: 3600 * 24 * 30, // not required, default is 2 weeks
});


/**
 * we don't use real database in this example
 */
module.exports = Client;
