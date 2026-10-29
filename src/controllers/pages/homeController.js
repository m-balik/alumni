/** The pages that are not a resource: home, about, and the week 02 exercises. */
const { User, JobPosting, Announcement } = require('../../models');
const { asyncHandler } = require('../../middleware/errors');

/** GET / */
exports.home = asyncHandler(async (req, res) => {
  const [users, jobs, announcements] = await Promise.all([
    User.all(), JobPosting.all(), Announcement.all(),
  ]);
  res.render('home', {
    title: 'Alumni Tracking System',
    counts: { users: users.length, alumni: users.filter((u) => u.is_alumni).length, jobs: jobs.length },
    announcements: announcements.filter((a) => a.is_published).slice(0, 3),
  });
});

/** GET /about */
exports.about = (req, res) => {
  res.render('about', { title: 'About' });
};
