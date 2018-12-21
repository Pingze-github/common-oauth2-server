const MemoryStorage = require('simple-memory-storage');

const db = new MemoryStorage();

// Implement your User entity here
class User {
  static set(username, user) {
    return db.set(username, user);
  }

  static get(username) {
    return db.get(username);
  }

  static verify(username, password) {
    return db.get(username).password === password;
  }
}

// pre-store an user for the example
User.set('wang', {
  id: 1,
  username: 'wang',
  email: 'wang@2980.com',
  avatat_url: 'https://ss1.bdstatic.com/70cFuXSh_Q1YnxGkpoWK1HF6hhy/it/u=3941939438,2918377309&fm=26&gp=0.jpg',
  sex: 'male',
  password: '123456',
});

/**
 * we don't use real database in this example
 */
module.exports = User;
