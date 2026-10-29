/**
 * UserController — HTML, for people.
 * Same model as ApiUserController, different view. Two faces, one truth.
 */
const { User, JobPosting, Application } = require('../../models');
const { asyncHandler } = require('../../middleware/errors');

/** GET /users */
exports.index = asyncHandler(async (req, res) => {
  const users = await User.all();
  res.render('users/index', { title: 'Alumni', users, flash: req.query.flash || null });
});

/** GET /users/new */
exports.createForm = (req, res) => {
  res.render('users/form', { title: 'New user', user: null, errors: null });
};

/** POST /users */
exports.store = asyncHandler(async (req, res) => {
  try {
    await User.create_(req.body);
  } catch (err) {
    if (err.status === 400 || err.status === 409) {
      return res.status(err.status).render('users/form', {
        title: 'New user', user: req.body, errors: err.message,
      });
    }
    throw err;
  }
  res.redirect('/users?flash=User+created');
});

/** GET /users/:id — one user with their postings */
exports.show = asyncHandler(async (req, res, next) => {
  const user = await User.oneWithJobs(req.params.id);
  if (!user) return next();
  const applications = await Application.applicationsOf(req.params.id);
  res.render('users/show', { title: user.name, user, jobs: user.jobs || [], applications });
});

/** GET /users/:id/edit */
exports.editForm = asyncHandler(async (req, res, next) => {
  const user = await User.oneById(req.params.id);
  if (!user) return next();
  res.render('users/form', { title: `Edit ${user.name}`, user, errors: null });
});

/** PATCH /users/:id (forms send it with ?_method=PATCH) */
exports.update = asyncHandler(async (req, res, next) => {
  try {
    const user = await User.update_(req.params.id, req.body);
    if (!user) return next();
  } catch (err) {
    if (err.status === 400 || err.status === 409) {
      return res.status(err.status).render('users/form', {
        title: 'Edit user', user: { id: req.params.id, ...req.body }, errors: err.message,
      });
    }
    throw err;
  }
  res.redirect(`/users/${req.params.id}`);
});

/** DELETE /users/:id */
exports.destroy = asyncHandler(async (req, res, next) => {
  try {
    const removed = await User.delete_(req.params.id);
    if (!removed) return next();
  } catch (err) {
    if (err.status === 409) {
      return res.redirect(`/users/${req.params.id}?flash=${encodeURIComponent(err.message)}`);
    }
    throw err;
  }
  res.redirect('/users?flash=User+deleted');
});

/** POST /users/:id/jobs — add a posting from the user's page */
exports.storeJob = asyncHandler(async (req, res, next) => {
  const user = await User.oneById(req.params.id);
  if (!user) return next();
  await JobPosting.createForUser(req.params.id, req.body);
  res.redirect(`/users/${req.params.id}`);
});
