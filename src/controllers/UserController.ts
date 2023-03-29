import { Request, Response } from 'express';
import argon2 from 'argon2';
import { isBefore, parseISO, formatDistanceToNow } from 'date-fns';
import { addNewUser, getUserByUsername, allUserData } from '../models/UserModel';
import { parseDatabaseError } from '../utils/db-utils';

async function getUser(req: Request, res: Response): Promise<void> {
  const { username } = req.params as UserNameParams;
  const user = await getUserByUsername(username);

  if (!user) {
    res.sendStatus(404);
    return;
  }
  console.log(user);
  res.json(user);
}

async function getAllUsers(req: Request, res: Response): Promise<void> {
  res.json(await allUserData());
}

async function registerUser(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body as AuthRequest;

  // IMPORTANT: Hash the password
  const passwordHash = await argon2.hash(password);

  try {
    // IMPORTANT: Store the `passwordHash` and NOT the plaintext password
    const newUser = await addNewUser(username, passwordHash);
    console.log(newUser);
    res.sendStatus(201);
  } catch (err) {
    console.error(err);
    const databaseErrorMessage = parseDatabaseError(err);
    res.status(500).json(databaseErrorMessage);
  }
}

async function logIn(req: Request, res: Response): Promise<void> {
  console.log(req.session);

  const now = new Date();
  // NOTES: We need to convert the date string back into a Date() object
  //        `parseISO()` does the conversion
  const logInTimeout = parseISO(req.session.logInTimeout);
  // NOTES: If the client has a timeout set and it has not expired
  if (logInTimeout && isBefore(now, logInTimeout)) {
    // NOTES: This will create a human friendly duration message
    const timeRemaining = formatDistanceToNow(logInTimeout);
    const message = `You have ${timeRemaining} remaining.`;
    // NOTES: Reject their request
    res.status(429).send(message); // 429 Too Many Requests
    return;
  }

  const { username, password } = req.body as AuthRequest;

  const user = await getUserByUsername(username);
  if (!user) {
    res.sendStatus(404); // 404 Not Found - username doesn't exist
    return;
  }

  const { passwordHash } = user;
  if (!(await argon2.verify(passwordHash, password))) {
    res.sendStatus(404); // 404 Not Found - user with username/pass doesn't exist
  }
  await req.session.clearSession();

  // NOTES: Now we can add whatever data we want to the session
  req.session.authenticatedUserForPro = {
    userId: user.userId,
  };
  req.session.authenticatedUserForAdmin = {
    username: user.username,
  };
  req.session.isLoggedIn = true;

  res.sendStatus(200);
}

export { getUser, getAllUsers, registerUser, logIn };
