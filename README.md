# MusicAI (Node.js backend)

This is the REST API for my 2023 Computer Science graduation project, MusicAI. It handles user accounts and stores the melodies recorded in the [MusicAI-mobile](https://github.com/Medkuee/MusicAI-mobile) app. Music generation itself happens in [MusicAI-backend-Python-](https://github.com/Medkuee/MusicAI-backend-Python-).

It's a portfolio project and isn't deployed anywhere.

## Endpoints

| Method | Path           | Auth | Description                                                       |
| ------ | -------------- | ---- | ----------------------------------------------------------------- |
| POST   | `/signup`      | –    | `{ email, password, name }` → the new user (no password hash)    |
| POST   | `/login`       | –    | `{ email, password }` → `{ token }` (JWT, valid for 7 days)      |
| GET    | `/profile`     | yes  | The logged-in user with their recordings, newest first           |
| POST   | `/createMusic` | yes  | `{ data: notes[] }` → the saved recording with its `id`          |
| GET    | `/music/:id`   | yes  | One recording. Returns 404 unless it belongs to the logged-in user |

"Auth" means the endpoint needs an `Authorization: Bearer <token>` header.

Each note looks like `{ note, noteValue, startTime, duration }`:

- `note` is the piano key index (0–87).
- `noteValue` is the note name, e.g. `"C4"`.
- `startTime` is in ms from the first note.
- `duration` is in seconds.

A recording can have 1–100 notes, and anything else is rejected with `400`.

## Tech stack

- Node.js, Express 4
- Prisma 4 with MySQL 5.7, run in Docker (phpMyAdmin is included for browsing the data)
- bcrypt for password hashing, jsonwebtoken for login tokens, dotenv for config

## Running locally

You need Node 16 or newer, Yarn and Docker.

```bash
cp .env.example .env        # set DB_PASSWORD and JWT_SECRET
yarn install
docker compose up -d        # MySQL on localhost:3310, phpMyAdmin on localhost:8090
yarn prisma migrate dev     # create the tables
node index.js               # http://localhost:3000
```

The server refuses to start if `JWT_SECRET` isn't set. MySQL only reads `DB_PASSWORD` the first time it creates its data volume. If you change the password later, either run `docker compose down -v` (this deletes the data) or change it inside MySQL.

## Limitations

- There are no automated tests in the repo.
- Some database errors come back as `401 Invalid token`, because each route uses one `catch` for everything.
- There's no rate limiting, and tokens can't be revoked before they expire.
- The `name` field on a recording is never set by the app.
