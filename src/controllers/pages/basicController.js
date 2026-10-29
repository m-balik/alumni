/**
 * Week 02 — the doors of the system, kept as they were built.
 * A path segment is text: /sum/3/4 answering "34" means you added two strings.
 */

/** GET /hello */
exports.hello = (req, res) => {
  res.type('text/plain').status(200).send('Hello, World!');
};

/** GET /hello/:name — a wildcard matches any value in that segment */
exports.helloName = (req, res) => {
  res.type('text/plain').status(200).send(`Hello, ${req.params.name}!`);
};

/** GET /sum/:a/:b — turn the text into a number first */
exports.sum = (req, res) => {
  const a = Number(req.params.a);
  const b = Number(req.params.b);

  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    // /sum/3/banana is the caller's mistake -> 400, not 500
    return res.status(400).json({
      error: 'Both path parameters must be numbers',
      received: { a: req.params.a, b: req.params.b },
    });
  }
  res.status(200).json({ a, b, sum: a + b });
};

/** GET /ok — the very first route of the term */
exports.ok = (req, res) => {
  res.type('text/plain').status(200).send('ok');
};
