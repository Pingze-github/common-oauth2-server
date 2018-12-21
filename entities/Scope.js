const MemoryStorage = require('simple-memory-storage');

const db = new MemoryStorage();

// Implement your Entity here
class Scope {
  static set(key, scope) {
    return db.set(key, scope);
  }

  static get(key) {
    return db.get(key);
  }
}

// pre-store for the example
Scope.set('user_info:read', {
  desc: 'read user information',
});

Scope.set('user_info:write', {
  desc: 'modify user information',
});

/**
 * we don't use real database in this example
 */
module.exports = Scope;
