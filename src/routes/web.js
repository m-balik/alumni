/**
 * The routing table — HTML side.
 * Same models, different controllers, different views.
 */
const express = require('express');

const home = require('../controllers/pages/homeController');
const users = require('../controllers/pages/userController');
const jobs = require('../controllers/pages/jobController');
const announcements = require('../controllers/pages/announcementController');

const router = express.Router();

router.get('/', home.home);
router.get('/about', home.about);

/* users — /users/new must come before /users/:id */
router.get('/users', users.index);
router.get('/users/new', users.createForm);
router.post('/users', users.store);
router.get('/users/:id', users.show);
router.get('/users/:id/edit', users.editForm);
router.patch('/users/:id', users.update);
router.put('/users/:id', users.update);
router.delete('/users/:id', users.destroy);
router.post('/users/:id/jobs', users.storeJob);

/* job postings */
router.get('/jobs', jobs.index);
router.get('/jobs/:id', jobs.show);
router.delete('/jobs/:id', jobs.destroy);

/* announcements */
router.get('/announcements', announcements.index);
router.get('/announcements/new', announcements.createForm);
router.post('/announcements', announcements.store);
router.get('/announcements/:id/edit', announcements.editForm);
router.patch('/announcements/:id', announcements.update);
router.delete('/announcements/:id', announcements.destroy);

module.exports = router;
