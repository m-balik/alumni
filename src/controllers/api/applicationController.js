/**
 * ApiApplicationController — the many-to-many.
 * 201 the first time, 409 the second time, 404 when the posting or the user is missing.
 */
const { User, JobPosting, Application } = require('../../models');
const { asyncHandler } = require('../../middleware/errors');

/** POST /api/jobs/:id/applications  body: { "userId": 3 } */
exports.apply = asyncHandler(async (req, res) => {
  const posting = await JobPosting.oneById(req.params.id);
  if (!posting) return res.status(404).json({ error: `Job posting ${req.params.id} not found` });

  const userId = req.body.userId ?? req.body.user_id;
  const user = await User.oneById(userId);
  if (!user) return res.status(404).json({ error: `User ${userId} not found` });

  const application = await Application.apply(req.params.id, userId, req.body.status);
  res.status(201).json(application);
});

/** GET /api/jobs/:id/applications — the applicants of one posting */
exports.applicants = asyncHandler(async (req, res) => {
  const posting = await JobPosting.oneById(req.params.id);
  if (!posting) return res.status(404).json({ error: `Job posting ${req.params.id} not found` });
  res.status(200).json(await Application.applicantsOf(req.params.id));
});

/** GET /api/users/:id/applications — where one user applied */
exports.byUser = asyncHandler(async (req, res) => {
  const user = await User.oneById(req.params.id);
  if (!user) return res.status(404).json({ error: `User ${req.params.id} not found` });
  res.status(200).json(await Application.applicationsOf(req.params.id));
});

/** DELETE /api/jobs/:id/applications/:userId */
exports.withdraw = asyncHandler(async (req, res) => {
  const removed = await Application.withdraw(req.params.id, req.params.userId);
  if (!removed) return res.status(404).json({ error: 'No such application' });
  res.status(204).send();
});
