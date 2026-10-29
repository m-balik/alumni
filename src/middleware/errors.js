/**
 * The model refuses, the controller turns the refusal into a status code.
 * These are the refusals.
 */
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = this.constructor.name;
  }
}

class ValidationFailed extends HttpError {
  constructor(message = 'Invalid data') { super(400, message); }
}

class NotFound extends HttpError {
  constructor(message = 'Not found') { super(404, message); }
}

class Conflict extends HttpError {
  constructor(message = 'Conflict') { super(409, message); }
}

/** wraps an async controller so a rejected promise reaches the error handler */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const wantsJson = (req) => req.originalUrl.startsWith('/api') || req.accepts(['html', 'json']) === 'json';

function notFound(req, res, next) {
  if (wantsJson(req)) {
    return res.status(404).json({ error: 'Not Found', path: req.originalUrl });
  }
  return res.status(404).render('error', { title: '404', status: 404, message: 'Nothing is there.' });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (status >= 500) console.error('[500]', err);

  if (wantsJson(req)) {
    return res.status(status).json({ error: err.message || 'Server Error' });
  }
  return res.status(status).render('error', {
    title: String(status),
    status,
    message: err.message || 'Server Error',
  });
}

/** some drivers do not classify the error; fall back to reading it */
const isForeignKeyError = (err) =>
  err && (err.name === 'SequelizeForeignKeyConstraintError' || /foreign key/i.test(err.message || ''));

const isUniqueError = (err) =>
  err && (err.name === 'SequelizeUniqueConstraintError' || /unique|duplicate key/i.test(err.message || ''));

module.exports = { HttpError, ValidationFailed, NotFound, Conflict, asyncHandler, notFound, errorHandler, isForeignKeyError, isUniqueError };
