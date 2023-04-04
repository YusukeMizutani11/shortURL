import './config'; // Load environment variables
import 'express-async-errors'; // Enable default error handling for async errors
import express, { Express } from 'express';

import session from 'express-session';
import connectSqlite3 from 'connect-sqlite3';
import { getUser, getAllUsers, registerUser, logIn } from './controllers/UserController';
import { shortenUrl, getLinks, deleteUserLink, getOriginalUrl } from './controllers/LinkController';

const app: Express = express();
const { PORT, COOKIE_SECRET } = process.env;

const SQLiteStore = connectSqlite3(session);
const store = new SQLiteStore({ db: 'sessions.sqlite' });

app.use(express.static('public', { extensions: ['html'] }));

app.use(
  session({
    store,
    secret: COOKIE_SECRET,
    cookie: { maxAge: 8 * 60 * 60 * 1000 }, // 8 hours
    name: 'session',
    resave: false,
    saveUninitialized: false,
  })
);

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.post('/api/users', registerUser); // Create an account
app.post('/api/login', logIn); // Log in to an account

app.get('/api/users/:username', getUser); // get user by username
app.get('/api/users', getAllUsers); // get all users

app.get('/:targetLinkId', getOriginalUrl); // visit the shortened link
app.get('/api/users/:targetUserId/links', getLinks); // get all links for the target user

app.post('/api/links', shortenUrl); // create a new shortened link

app.delete('/api/users/:targetUserId/links/:targetLinkId', deleteUserLink);

app.listen(PORT, () => {
  console.log(`Listening at http://localhost:${PORT}`);
});
