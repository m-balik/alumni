/**
 * ApiUserController — JSON, for programs.
 * It reads the request, asks the model, and sends the answer with the right status code.
 * It never touches the data itself.
 */
const { User } = require('../../models');
const { asyncHandler } = require('../../middleware/errors');

/** GET /api/users */
exports.index = asyncHandler(async (req, res) => {
  const users = await User.all();
  res.status(200).json(users);
});

/** GET /api/users/:id  — the user with their jobs inside (one answer, two tables) */
exports.show = asyncHandler(async (req, res) => {
  const user = await User.oneWithJobs(req.params.id);
  if (!user) return res.status(404).json({ error: `User ${req.params.id} not found` });
  res.status(200).json(user);
});

/** POST /api/users */
exports.store = asyncHandler(async (req, res) => {
  const user = await User.create_(req.body);
  res.status(201).json(user);
});

/** PATCH /api/users/:id — changes only the fields sent */
exports.patch = asyncHandler(async (req, res) => {
  const user = await User.update_(req.params.id, req.body);
  if (!user) return res.status(404).json({ error: `User ${req.params.id} not found` });
  res.status(200).json(user);
});

/** PUT /api/users/:id — replaces the whole thing */
exports.replace = asyncHandler(async (req, res) => {
  const exists = await User.oneById(req.params.id);
  if (!exists) return res.status(404).json({ error: `User ${req.params.id} not found` });
  User.validate_(req.body); // PUT must carry a complete user
  const user = await User.update_(req.params.id, {
    department: null,
    graduationYear: null,
    isAlumni: false,
    ...req.body,
  });
  res.status(200).json(user);
});

/** DELETE /api/users/:id — 204, no body */
exports.destroy = asyncHandler(async (req, res) => {
  const removed = await User.delete_(req.params.id);
  if (!removed) return res.status(404).json({ error: `User ${req.params.id} not found` });
  res.status(204).send();
});
