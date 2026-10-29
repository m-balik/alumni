/** AnnouncementController — the page face of the announcements. */
const { Announcement } = require('../../models');
const { asyncHandler } = require('../../middleware/errors');

exports.index = asyncHandler(async (req, res) => {
  res.render('announcements/index', {
    title: 'Announcements',
    announcements: await Announcement.all(),
    flash: req.query.flash || null,
  });
});

exports.createForm = (req, res) => {
  res.render('announcements/form', { title: 'New announcement', announcement: null, errors: null });
};

exports.store = asyncHandler(async (req, res) => {
  try {
    await Announcement.create_(req.body);
  } catch (err) {
    if (err.status === 400) {
      return res.status(400).render('announcements/form', {
        title: 'New announcement', announcement: req.body, errors: err.message,
      });
    }
    throw err;
  }
  res.redirect('/announcements?flash=Announcement+created');
});

exports.editForm = asyncHandler(async (req, res, next) => {
  const announcement = await Announcement.oneById(req.params.id);
  if (!announcement) return next();
  res.render('announcements/form', { title: 'Edit announcement', announcement, errors: null });
});

exports.update = asyncHandler(async (req, res, next) => {
  const row = await Announcement.update_(req.params.id, {
    isPublished: false, // a checkbox that is not ticked sends nothing
    ...req.body,
  });
  if (!row) return next();
  res.redirect('/announcements?flash=Announcement+updated');
});

exports.destroy = asyncHandler(async (req, res, next) => {
  const removed = await Announcement.delete_(req.params.id);
  if (!removed) return next();
  res.redirect('/announcements?flash=Announcement+deleted');
});
