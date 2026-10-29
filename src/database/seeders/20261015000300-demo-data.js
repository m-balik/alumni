'use strict';

/**
 * The seed empties the tables first — in the right order — and resets the id
 * counters, so it can run twice without exploding.
 *
 * Order matters: applications (child) -> job_postings -> users.
 */
const {
  userFactory,
  jobPostingFactory,
  applicationFactory,
  announcementFactory,
} = require('../factories');

/** child first, then the parents; RESTART IDENTITY puts the id counters back to 1 */
async function emptyEverything(queryInterface) {
  const tables = ['applications', 'job_postings', 'users', 'announcements'];
  for (const table of tables) {
    await queryInterface.sequelize.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE;`);
  }
}

module.exports = {
  async up(queryInterface) {
    /* ---------- empty first, child -> parent ---------- */
    await emptyEverything(queryInterface);

    /* ---------- users: fixed ones first, so the demo is predictable ---------- */
    const fixedUsers = [
      userFactory({ name: 'Ada Yılmaz', email: 'ada@ogr.iu.edu.tr', is_alumni: true, graduation_year: 2019 }),
      userFactory({ name: 'Can Öztürk', email: 'can@ogr.iu.edu.tr', is_alumni: true, graduation_year: 2023 }),
      userFactory({ name: 'Elif Kaya', email: 'elif@ogr.iu.edu.tr', is_alumni: false, graduation_year: null }),
    ];
    const generatedUsers = Array.from({ length: 9 }, () => userFactory());

    await queryInterface.bulkInsert('users', [...fixedUsers, ...generatedUsers]);

    const [users] = await queryInterface.sequelize.query(
      'SELECT id, is_alumni FROM users ORDER BY id ASC;'
    );
    const alumni = users.filter((u) => u.is_alumni);
    const posters = alumni.length ? alumni : users;

    /* ---------- job postings: only alumni post jobs ---------- */
    const postings = [];
    posters.forEach((user, index) => {
      const howMany = (index % 3) + 1; // 1..3 postings each
      for (let i = 0; i < howMany; i += 1) postings.push(jobPostingFactory(user.id));
    });
    await queryInterface.bulkInsert('job_postings', postings);

    const [jobs] = await queryInterface.sequelize.query(
      'SELECT id, user_id FROM job_postings ORDER BY id ASC;'
    );

    /* ---------- applications: unique (user, posting), nobody applies to their own ---------- */
    const seen = new Set();
    const applications = [];
    jobs.forEach((job, jobIndex) => {
      users.forEach((user, userIndex) => {
        if (user.id === job.user_id) return;              // not your own posting
        if ((jobIndex + userIndex) % 4 !== 0) return;      // only some of them apply
        const key = `${user.id}:${job.id}`;
        if (seen.has(key)) return;
        seen.add(key);
        applications.push(applicationFactory(user.id, job.id));
      });
    });
    if (applications.length) await queryInterface.bulkInsert('applications', applications);

    /* ---------- announcements ---------- */
    await queryInterface.bulkInsert('announcements', [
      announcementFactory({ title: 'Welcome to the Alumni Tracking System', body: 'Create your profile, post a job, apply to one.' }),
      announcementFactory(),
      announcementFactory(),
    ]);
  },

  async down(queryInterface) {
    await emptyEverything(queryInterface);
  },
};
