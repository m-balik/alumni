/**
 * Factories — fake but realistic rows, for development only.
 * No external faker library: everything is generated from these small lists,
 * so `npm install` stays light and the seed is reproducible.
 */
const FIRST_NAMES = ['Elif', 'Mert', 'Zeynep', 'Can', 'Ada', 'Deniz', 'Ece', 'Kaan', 'Berk', 'Nil',
  'Emre', 'Selin', 'Arda', 'Irmak', 'Burak', 'Melis', 'Onur', 'Sude', 'Yusuf', 'Defne'];
const LAST_NAMES = ['Kaya', 'Aydın', 'Arslan', 'Öztürk', 'Demir', 'Çelik', 'Yılmaz', 'Şahin',
  'Koç', 'Doğan', 'Polat', 'Aksoy'];
const DEPARTMENTS = ['Management Information Systems', 'Computer Engineering', 'Economics',
  'Business Administration', 'Statistics'];
const COMPANIES = ['Acme', 'Mavi Yazılım', 'Datakule', 'Nova Bank', 'Pixel Studio',
  'Kuzey Teknoloji', 'Bogazici Analytics'];
const TITLES = ['Backend Intern', 'Data Analyst', 'QA Tester', 'Junior Developer',
  'Frontend Developer', 'DevOps Intern', 'Product Analyst'];
const CITIES = ['İstanbul', 'Ankara', 'İzmir', 'Remote', 'Kocaeli'];

/** a tiny deterministic pseudo-random generator, so seeds repeat identically */
function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

const random = rng(20261027);
const pick = (list) => list[Math.floor(random() * list.length)];
const int = (min, max) => min + Math.floor(random() * (max - min + 1));

let emailCounter = 0;

function userFactory(overrides = {}) {
  const first = pick(FIRST_NAMES);
  const last = pick(LAST_NAMES);
  const isAlumni = random() > 0.35;
  emailCounter += 1;

  const slug = `${first}.${last}`
    .toLowerCase()
    .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c');

  return {
    name: `${first} ${last}`,
    email: `${slug}${emailCounter}@ogr.iu.edu.tr`,
    is_alumni: isAlumni,
    graduation_year: isAlumni ? int(2014, 2026) : null,
    department: pick(DEPARTMENTS),
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

function jobPostingFactory(userId, overrides = {}) {
  const title = pick(TITLES);
  const company = pick(COMPANIES);
  return {
    user_id: userId,
    title,
    company,
    location: pick(CITIES),
    description: `${company} is looking for a ${title.toLowerCase()}. Posted through the alumni network.`,
    is_open: random() > 0.2,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

function applicationFactory(userId, jobPostingId, overrides = {}) {
  return {
    user_id: userId,
    job_posting_id: jobPostingId,
    status: pick(['applied', 'applied', 'applied', 'interview', 'rejected']),
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

function announcementFactory(overrides = {}) {
  const topics = [
    ['Midterm week', 'The midterm covers weeks 01-06. Bring your student card.'],
    ['Alumni meetup', 'The autumn alumni meetup is on campus, Beyazıt, at 18:00.'],
    ['Internship season', 'New job postings are published by alumni every week.'],
    ['Career talk', 'A graduate from 2018 will talk about backend engineering.'],
  ];
  const [title, body] = pick(topics);
  return {
    title,
    body,
    is_published: true,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

module.exports = {
  userFactory,
  jobPostingFactory,
  applicationFactory,
  announcementFactory,
  makeMany: (factory, count, ...args) =>
    Array.from({ length: count }, () => factory(...args)),
};
