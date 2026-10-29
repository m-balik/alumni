/** JobController — the page face of the job postings. */
const { JobPosting, Application } = require('../../models');
const { asyncHandler } = require('../../middleware/errors');

exports.index = asyncHandler(async (req, res) => {
  res.render('jobs/index', {
    title: 'Job postings',
    jobs: await JobPosting.all(),
    flash: req.query.flash || null,
  });
});

exports.show = asyncHandler(async (req, res, next) => {
  const job = await JobPosting.oneById(req.params.id);
  if (!job) return next();
  const applicants = await Application.applicantsOf(req.params.id);
  res.render('jobs/show', { title: job.title, job, applicants, flash: req.query.flash || null });
});

exports.destroy = asyncHandler(async (req, res, next) => {
  const removed = await JobPosting.delete_(req.params.id);
  if (!removed) return next();
  res.redirect('/jobs?flash=Posting+deleted');
});
