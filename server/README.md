Setup

1. Create a .env file in this folder with:

MONGO_URI=... # your MongoDB connection string
JWT_SECRET=... # long random string
PORT=4000

2. Install deps (run inside server/):

npm install

3. Run dev server:

npm run dev

API

- POST /api/auth/register { firstName, lastName, company, email, password, role }
- POST /api/auth/login { email, password, role? }

Both return { token, user } on success.

