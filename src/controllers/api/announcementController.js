/** ApiAnnouncementController — JSON (week 04 homework, now on the database). */
const { Announcement } = require('../../models');
const { asyncHandler } = require('../../middleware/errors');

exports.index = asyncHandler(async (req, res) => {
  res.status(200).json(await Announcement.all());
});

exports.show = asyncHandler(async (req, res) => {
  const row = await Announcement.oneById(req.params.id);
  if (!row) return res.status(404).json({ error: `Announcement ${req.params.id} not found` });
  res.status(200).json(row);
});

exports.store = asyncHandler(async (req, res) => {
  res.status(201).json(await Announcement.create_(req.body));
});

exports.patch = asyncHandler(async (req, res) => {
  const row = await Announcement.update_(req.params.id, req.body);
  if (!row) return res.status(404).json({ error: `Announcement ${req.params.id} not found` });
  res.status(200).json(row);
});

exports.destroy = asyncHandler(async (req, res) => {
  const removed = await Announcement.delete_(req.params.id);
  if (!removed) return res.status(404).json({ error: `Announcement ${req.params.id} not found` });
  res.status(204).send();
});
