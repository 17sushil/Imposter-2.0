// Simple JSON account storage and signed cookie sessions for the prototype.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const usersFile = process.env.USERS_FILE || path.join(__dirname, '../data/users.json');
const SESSION_LIFETIME = 8 * 60 * 60 * 1000;
// A stable secret is required in production; never commit it to the repository.
const secret = process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' && crypto.randomBytes(32).toString('hex'));
if (!secret || (process.env.NODE_ENV === 'production' && Buffer.byteLength(secret) < 32)) {
  throw new Error('Set JWT_SECRET to a random secret of at least 32 bytes.');
}
function normalize(name) { return name.trim().toLowerCase(); }
function validate(name, password) {
  if (typeof name !== 'string' || !/^[a-zA-Z0-9_.@+-]{3,100}$/.test(name)) return 'Use 3–100 letters, numbers, or . _ @ + - for your username or email.';
  if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) return 'Password must be at least 8 characters and no more than 72 UTF-8 bytes.';
  return '';
}
function readUsers() { return JSON.parse(fs.readFileSync(usersFile, 'utf8')); }
function createUser(name, password) {
  const error = validate(name, password);
  if (error) return error;
  const users = readUsers();
  const username = normalize(name);
  if (users.some(user => user.username === username)) return 'That username or email is already in use.';
  users.push({ username, passwordHash: bcrypt.hashSync(password, 12) });
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2) + '\n', { mode: 0o600 });
  return '';
}
function checkPassword(name, password) {
  if (validate(name, password)) return false;
  const user = readUsers().find(user => user.username === normalize(name));
  return user ? bcrypt.compareSync(password, user.passwordHash) : false;
}
function startSession(name) {
  return jwt.sign({ sub: normalize(name) }, secret, { algorithm: 'HS256', expiresIn: '8h', issuer: 'imposter-login', audience: 'imposter-player' });
}
function getSession(token) {
  try {
    const session = jwt.verify(token, secret, { algorithms: ['HS256'], issuer: 'imposter-login', audience: 'imposter-player' });
    if (typeof session.sub !== 'string' || !readUsers().some(user => user.username === session.sub)) return null;
    return { name: session.sub };
  } catch { return null; }
}
module.exports = { validate, createUser, checkPassword, startSession, getSession, SESSION_LIFETIME };
