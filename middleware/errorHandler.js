// eslint-disable-next-line no-unused-vars
export default function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const body = {
    error: err.code || (status === 500 ? 'internal_error' : 'request_error'),
    message: err.message || 'Unexpected error',
  };

  if (process.env.NODE_ENV === 'development') {
    body.stack = err.stack;
  }

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json(body);
}
