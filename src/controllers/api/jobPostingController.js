/**
 * ApiJobPostingController — nested under a user:
 * /api/users/:id/jobs means "the jobs of this user". The URL, not the body, says whose it is.
 */
const { User, JobPosting } = require('../../models');
const { asyncHandler } = require('../../middleware/errors');

/** GET /api/jobs — every posting */
exports.index = asyncHandler(async (req, res) => {
  res.status(200).json(await JobPosting.all());
});

/** GET /api/jobs/:id */
exports.show = asyncHandler(async (req, res) => {
  const posting = await JobPosting.oneById(req.params.id);
  if (!posting) return res.status(404).json({ error: `Job posting ${req.params.id} not found` });
  res.status(200).json(posting);
});

/** GET /api/users/:id/jobs */
exports.indexForUser = asyncHandler(async (req, res) => {
  const user = await User.oneById(req.params.id);
  if (!user) return res.status(404).json({ error: `User ${req.params.id} not found` });
  res.status(200).json(await JobPosting.allForUser(req.params.id));
});

/** POST /api/users/:id/jobs */
exports.storeForUser = asyncHandler(async (req, res) => {
  const user = await User.oneById(req.params.id);
  if (!user) return res.status(404).json({ error: `User ${req.params.id} not found` });
  const posting = await JobPosting.createForUser(req.params.id, req.body);
  res.status(201).json(posting);
});

/** PATCH /api/jobs/:id */
exports.patch = asyncHandler(async (req, res) => {
  const posting = await JobPosting.update_(req.params.id, req.body);
  if (!posting) return res.status(404).json({ error: `Job posting ${req.params.id} not found` });
  res.status(200).json(posting);
});

/** DELETE /api/jobs/:id */
exports.destroy = asyncHandler(async (req, res) => {
  const removed = await JobPosting.delete_(req.params.id);
  if (!removed) return res.status(404).json({ error: `Job posting ${req.params.id} not found` });
  res.status(204).send();
});
