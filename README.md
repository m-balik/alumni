# alumni — Alumni Tracking System

Term project of **Web Programming** · Istanbul University, Management Information Systems · Fall 2026.

A register of students and graduates. Alumni publish job postings; users apply to them.
Everything is one system: an HTML face for people, a JSON API for programs, one model behind both.

**The whole thing comes up with one command: `docker compose up`.**

---

## What it must do

- Keep **users** (students and graduates). An alumnus is a user who graduated — `isAlumni` and `graduationYear` are fields, not a second list.
- Let a user **publish job postings** (one user → many postings).
- Let users **apply** to postings (many users ↔ many postings), with no double applications.
- Publish short **announcements**.
- Answer the same data twice: **JSON** under `/api/...` and **HTML pages** under `/...`.
- List and try every endpoint on **Swagger UI** at `/api/swagger`.

---

## The stack, and one weakness of each choice

| Layer | Choice | Why | Its weakness |
|---|---|---|---|
| Back end | **Node.js + Express** | One language on both sides; the request/response model is explicit; huge ecosystem | Single-threaded: one heavy CPU task blocks every other request |
| Database | **PostgreSQL** | Real foreign keys, real unique constraints, strict types — the rules are enforced by the database, not only by my code | Heavier to set up and to change; every change needs a migration |
| ORM | **Sequelize** | Writes the SQL, keeps the model layer readable, has a proper migration/seeder CLI | Hides the SQL — a careless `include` can become a very expensive query |
| Views | **EJS** | Plain HTML with holes in it; nothing new to learn | No component model; big pages get repetitive |
| Everything | **Docker Compose** | The same two commands work on any machine | The first build is slow |

**AI assistant:** used throughout to type the syntax. The decisions — the routes, the schema, the
delete rule, the status codes — are mine, and I can defend every line.

---

## Run it from zero

You need **Docker** and **Docker Compose**. Nothing else.

```bash
git clone https://github.com/<your-username>/alumni.git
cd alumni
cp .env.example .env         # then open .env and set DB_PASSWORD
docker compose up --build
```

That is all. On start the app container runs the migrations, runs the seed, and starts the server.

| What | Where |
|---|---|
| The site | http://localhost:3000 |
| Swagger UI | http://localhost:3000/api/swagger |
| Health check | http://localhost:3000/api/health |
| The database (DBeaver) | `localhost:5433`, database/user/password from your `.env` |

### Without Docker (local Node + a local PostgreSQL)

```bash
npm install
cp .env.example .env         # set DB_HOST=localhost and your own password
npm run migrate
npm run seed
npm start
```

### Useful commands

| Command | What it does |
|---|---|
| `docker compose up` | start everything |
| `docker compose down` | stop; **the data survives** in the named volume |
| `docker compose down -v` | stop **and delete the volume** — the tables are gone until migrate + seed run again |
| `npm run migrate` | apply the migrations |
| `npm run seed` | fill the tables with fake but realistic rows (it empties them first, so it can run twice) |
| `npm run db:reset` | undo everything, migrate again, seed again |

---

## Rules of this repository

1. **`ddd.md` is the source of truth** for the database. Design first, then code.
2. **Tables change only through migrations.** A change is a *new* migration — never an edit to one that already ran on another machine.
3. **`.env` never goes to GitHub.** `.gitignore` comes first; `.env.example` carries the keys with no real password.
4. **A rule is written once, in the model.** The controller turns a refusal into a status code.
5. **One task, one prompt, one commit.** Nothing exists until it is pushed.

---

## Architecture

```
alumni/
├── docker-compose.yml        # app + db, named volume, healthcheck
├── Dockerfile                # the app image
├── .env.example              # the keys, no passwords          (committed)
├── .env                      # the real values                 (NEVER committed)
├── .sequelizerc              # tells sequelize-cli where everything lives
├── ddd.md                    # the database design document — the source of truth
└── src/
    ├── server.js             # connects to the database, then listens
    ├── app.js                # express: view engine, parsers, swagger, routes, errors
    ├── config/
    │   └── config.js         # one config, read from .env, used by the app AND the CLI
    ├── routes/               # method + path -> a controller function. One line, no logic.
    │   ├── basic.js          #   week 02: /ok, /hello, /hello/:name, /sum/:a/:b
    │   ├── api.js            #   the JSON routing table
    │   └── web.js            #   the HTML routing table
    ├── controllers/
    │   ├── api/              # JSON, for programs
    │   │   ├── healthController.js
    │   │   ├── userController.js
    │   │   ├── jobPostingController.js
    │   │   ├── applicationController.js
    │   │   └── announcementController.js
    │   └── pages/            # HTML, for people — same models, different view
    │       ├── homeController.js
    │       ├── basicController.js
    │       ├── userController.js
    │       ├── jobController.js
    │       └── announcementController.js
    ├── models/               # the data and its rules. The only layer that knows about SQL.
    │   ├── index.js          #   the Sequelize instance and all the relations
    │   ├── user.js           #   all / oneById / create_ / update_ / delete_ + the rules
    │   ├── jobPosting.js
    │   ├── application.js
    │   └── announcement.js
    ├── views/                # EJS: what the user sees
    │   ├── partials/         #   head, foot, flash
    │   ├── home.ejs, about.ejs, error.ejs
    │   ├── users/            #   index, show, form
    │   ├── jobs/             #   index, show
    │   └── announcements/    #   index, form
    ├── middleware/
    │   └── errors.js         # ValidationFailed (400) · NotFound (404) · Conflict (409) · 500
    ├── database/
    │   ├── migrations/       # the only way a table changes
    │   ├── seeders/          # fake rows; empties the tables first, in the right order
    │   └── factories/        # how one fake row is made
    ├── docs/
    │   └── swagger.json      # every endpoint, listed and testable
    └── public/
        └── style.css
```

**Where a rule lives:** the **model** holds the data and its rules; the **controller** reads the
request, asks the model, and sends the answer with the right status code; the **view** turns data
into what the user sees; a **route** only says which method and path go to which controller
function. When the data moved from an array to a database, only the model files changed — the
controllers just learned to `await`.

---

## The API

| Method | Path | Answers |
|---|---|---|
| `GET` | `/api/health` | `200` `{ status, uptime, database }` |
| `GET` | `/api/users` | `200` every user |
| `POST` | `/api/users` | `201` the created user · `400` invalid · `409` email taken |
| `GET` | `/api/users/:id` | `200` the user **with their `jobs` inside** · `404` |
| `PUT` | `/api/users/:id` | `200` replaced · `400` · `404` |
| `PATCH` | `/api/users/:id` | `200` only the fields sent changed · `404` |
| `DELETE` | `/api/users/:id` | `204` no body · `404` · `409` still has postings |
| `GET` | `/api/users/:id/jobs` | `200` the postings of this user · `404` unknown user |
| `POST` | `/api/users/:id/jobs` | `201` created · `404` unknown user |
| `GET` | `/api/users/:id/applications` | `200` where this user applied |
| `GET` | `/api/jobs` · `/api/jobs/:id` | `200` · `404` |
| `PATCH` / `DELETE` | `/api/jobs/:id` | `200` / `204` · `404` |
| `GET` | `/api/jobs/:id/applications` | `200` the applicants |
| `POST` | `/api/jobs/:id/applications` | `201` applied · `409` **already applied** · `404` |
| `DELETE` | `/api/jobs/:id/applications/:userId` | `204` · `404` |
| `GET POST` | `/api/announcements` | `200` / `201` |
| `GET PATCH DELETE` | `/api/announcements/:id` | `200` / `200` / `204` · `404` |

Week 02 routes, kept as they were built: `GET /ok`, `GET /hello`, `GET /hello/:name`,
`GET /sum/:a/:b` (`/sum/3/4` → `7`; `/sum/3/banana` → `400`, because a path segment is text).

### Pages

`/` · `/about` · `/users` · `/users/new` · `/users/:id` · `/users/:id/edit` · `/jobs` · `/jobs/:id` · `/announcements` · `/announcements/new` · `/announcements/:id/edit`

---

## Try it in 60 seconds

```bash
curl http://localhost:3000/api/health

curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Elif Kaya","email":"elif.kaya@ogr.iu.edu.tr","isAlumni":true,"graduationYear":2024}'

# the same email again -> 409
curl -i -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Someone Else","email":"elif.kaya@ogr.iu.edu.tr"}'

# a posting, owned by user 1 — the URL says whose it is
curl -X POST http://localhost:3000/api/users/1/jobs \
  -H "Content-Type: application/json" \
  -d '{"title":"Junior Developer","company":"Acme","location":"İstanbul"}'

# the user with their jobs inside (LEFT JOIN)
curl http://localhost:3000/api/users/1

# apply, then apply again -> 409
curl -X POST http://localhost:3000/api/jobs/1/applications -H "Content-Type: application/json" -d '{"userId":2}'
curl -i -X POST http://localhost:3000/api/jobs/1/applications -H "Content-Type: application/json" -d '{"userId":2}'
```

### The forgetting test

```bash
curl -X POST http://localhost:3000/api/users -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@ogr.iu.edu.tr"}'
docker compose restart app
curl http://localhost:3000/api/users     # Test User is still there — the database remembers
```

`docker compose down` → the data survives in the volume.
`docker compose down -v` → the volume and the tables are gone, until migrate and seed run again.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `[db] connection failed` on start | `.env` missing or wrong password | `cp .env.example .env`, set `DB_PASSWORD`, `docker compose down -v && docker compose up --build` |
| Port 3000 or 5433 already in use | another program is on it | change `APP_PORT` / `DB_PORT_HOST` in `.env` |
| `relation "users" does not exist` | migrations did not run | `docker compose exec app npm run migrate` |
| Seed data looks duplicated | the seed ran twice without truncating | `docker compose exec app npm run db:reset` |
| Changed a migration that already ran | migrations are not edited, ever | write a **new** migration instead |

---

## Postman

`postman/alumni.postman_collection.json` — import it into Postman (File → Import). It has one saved
request per route, grouped by week, with example bodies. Set the collection variable `baseUrl`
if you changed `APP_PORT`.

The browser can send only `GET`; everything that is not a `GET` is tested here or on Swagger UI.
