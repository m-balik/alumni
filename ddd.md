# ddd.md — Database Design Document

**Alumni Tracking System** · Web Programming · Istanbul University, MIS · Fall 2026

This document is the **source of truth** for the database. Everything after it is built from it.
Tables change **only through migrations** — and a change travels as a *new* migration, never as an
edit to one that has already run.

---

## 1. What the system remembers

| Thing | Why it exists |
|---|---|
| **users** | Students and graduates. An alumnus is a user who graduated — being an alumnus is a *field*, not a separate list. |
| **job_postings** | Jobs published by alumni. One user has many postings; each posting belongs to exactly one user. |
| **applications** | Who applied to which posting. Many users ↔ many postings, through a join table. |
| **announcements** | Short notices shown on the home page. Independent of the rest. |

---

## 2. DBMS and settings

| | |
|---|---|
| DBMS | PostgreSQL 16 (`postgres:16-alpine`) |
| Access from the app | Sequelize ORM (`pg` driver) |
| Where the settings live | `.env` (never committed) — keys documented in `.env.example` |
| Keys | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` |
| Data folder | Docker **named volume** `alumni_db_data` → survives `docker compose down`, dies with `down -v` |
| Naming | `snake_case`, plural table names, timestamps `created_at` / `updated_at` on every table |

---

## 3. Tables

### 3.1 `users`

| Column | Type | Null | Key / rule |
|---|---|---|---|
| `id` | SERIAL | no | **PK**, auto-increment — ids are never reused |
| `name` | VARCHAR(120) | no | required |
| `email` | VARCHAR(160) | no | **UNIQUE** — the same email twice answers **409** |
| `is_alumni` | BOOLEAN | no | default `false` |
| `graduation_year` | INTEGER | yes | required *when* `is_alumni = true` (rule in the model) |
| `department` | VARCHAR(120) | yes | |
| `created_at` | TIMESTAMP | no | |
| `updated_at` | TIMESTAMP | no | |

Index: `is_alumni` (the alumni list is the most common filter).

> `status` is a short list of values kept as **text with a CHECK constraint**, not a Postgres
> `ENUM` type: adding a value to an ENUM later is a painful migration, a CHECK is a one-liner.

### 3.2 `job_postings`

| Column | Type | Null | Key / rule |
|---|---|---|---|
| `id` | SERIAL | no | **PK** |
| `user_id` | INTEGER | no | **FK → users.id**, `ON DELETE RESTRICT`, `ON UPDATE CASCADE` |
| `title` | VARCHAR(160) | no | required |
| `company` | VARCHAR(160) | no | required |
| `location` | VARCHAR(120) | yes | |
| `description` | TEXT | yes | |
| `is_open` | BOOLEAN | no | default `true` |
| `created_at` / `updated_at` | TIMESTAMP | no | |

Index: `user_id` (every nested route `/api/users/:id/jobs` reads by it).

> The foreign key is an ordinary column holding the id of a row in `users` — and the
> database checks it: you cannot post a job for a user who does not exist.

### 3.3 `applications` (join table)

| Column | Type | Null | Key / rule |
|---|---|---|---|
| `id` | SERIAL | no | **PK** |
| `user_id` | INTEGER | no | **FK → users.id**, `ON DELETE CASCADE` |
| `job_posting_id` | INTEGER | no | **FK → job_postings.id**, `ON DELETE CASCADE` |
| `status` | VARCHAR(20) + CHECK | no | one of `applied`, `interview`, `offer`, `rejected`; default `applied` |
| `created_at` / `updated_at` | TIMESTAMP | no | |

**UNIQUE (`user_id`, `job_posting_id`)** → the same person cannot apply to the same posting twice.
The database refuses; the controller answers **409**.

> Why the applicants cannot live inside `job_postings` or inside `users`:
> a posting would need an unknown number of applicant columns, and a user would need an
> unknown number of posting columns. One row per *pair* is the only shape that fits.

### 3.4 `announcements`

| Column | Type | Null |
|---|---|---|
| `id` | SERIAL | no (**PK**) |
| `title` | VARCHAR(160) | no |
| `body` | TEXT | no |
| `is_published` | BOOLEAN | no (default `true`) |
| `created_at` / `updated_at` | TIMESTAMP | no |

---

## 4. Relations

```
users 1 ──────< job_postings            one-to-many   (job_postings.user_id)
users >──── applications ────< job_postings   many-to-many (through the join table)
announcements                            stands alone
```

- `GET /api/users/:id` returns the user **with a `jobs` array inside**. The ORM writes a
  **LEFT JOIN**, so a user without postings still comes back, with `"jobs": []`.
  A plain (inner) JOIN would silently drop every user who has not posted anything.

---

## 5. The delete rule — a decision, with a reason

| Deleting | Rule | Why |
|---|---|---|
| a **user** who has postings | **RESTRICT** → 409 until the postings are gone | A posting without an owner is meaningless, but deleting somebody's job ads as a side effect of removing their profile is a surprise. Make the user decide. |
| a **user**'s applications | **CASCADE** | An application only exists as the link between a person and a posting. Without the person it is noise. |
| a **job posting** | its applications **CASCADE** | Same reason: the link dies with the thing it points to. |

---

## 6. Volume (expected size)

Small, teaching-scale data. Rough order of magnitude for one department over a few years:

| Table | Rows (expected) | Growth |
|---|---|---|
| `users` | ~2.000 | a few hundred per year |
| `job_postings` | ~5.000 | a few per user |
| `applications` | ~30.000 | the fastest-growing table |
| `announcements` | ~300 | slow |

Nothing here needs partitioning or sharding. The indexes above are enough.

---

## 7. Migrations in this repository

| Order | File | What it does |
|---|---|---|
| 1 | `20261001000100-create-users.js` | `users` |
| 2 | `20261001000200-create-announcements.js` | `announcements` |
| 3 | `20261015000100-create-job-postings.js` | `job_postings` + FK (RESTRICT) |
| 4 | `20261015000200-create-applications.js` | `applications` + the two FKs + the unique pair + the status CHECK |

The seed empties the tables in the child → parent order
(`applications`, `job_postings`, `users`, `announcements`) and resets the id counters,
so it can run twice.
