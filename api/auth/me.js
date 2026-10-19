import { isAuthenticated, authConfigured } from '../../lib/auth.js';
import { dbConfigured } from '../../lib/db.js';
import { send } from '../../lib/http.js';

export default async function handler(req, res) {
  const authenticated = isAuthenticated(req);
  const body = { authenticated, authConfigured: authConfigured() };
  if (authenticated) {
    body.dbConfigured = dbConfigured();
  }
  return send(res, 200, body);
}
