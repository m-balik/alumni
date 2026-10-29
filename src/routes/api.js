/**
 * The routing table — JSON side.
 * method + path -> controller function. One line, no logic.
 */
const express = require('express');

const health = require('../controllers/api/healthController');
const users = require('../controllers/api/userController');
const announcements = require('../controllers/api/announcementController');
const jobs = require('../controllers/api/jobPostingController');
const applications = require('../controllers/api/applicationController');

const router = express.Router();

/* health */
router.get('/health', health.health);

/* users */
router.get('/users', users.index);
router.post('/users', users.store);
router.get('/users/:id', users.show);          // includes the user's jobs
router.put('/users/:id', users.replace);
router.patch('/users/:id', users.patch);
router.delete('/users/:id', users.destroy);

/* nested: the jobs of this user — the URL says whose posting it is */
router.get('/users/:id/jobs', jobs.indexForUser);
router.post('/users/:id/jobs', jobs.storeForUser);
router.get('/users/:id/applications', applications.byUser);

/* job postings */
router.get('/jobs', jobs.index);
router.get('/jobs/:id', jobs.show);
router.patch('/jobs/:id', jobs.patch);
router.delete('/jobs/:id', jobs.destroy);

/* applications: the many-to-many */
router.get('/jobs/:id/applications', applications.applicants);
router.post('/jobs/:id/applications', applications.apply);
router.delete('/jobs/:id/applications/:userId', applications.withdraw);

/* announcements */
router.get('/announcements', announcements.index);
router.post('/announcements', announcements.store);
router.get('/announcements/:id', announcements.show);
router.patch('/announcements/:id', announcements.patch);
router.delete('/announcements/:id', announcements.destroy);

module.exports = router;
