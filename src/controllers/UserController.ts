import { Request, Response } from 'express';
import argon2 from 'argon2';
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

  const existingUser = await getUserByUsername(username);

  if (existingUser) {
    res.sendStatus(409);
    return;
  }

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

  const { username, password } = req.body as AuthRequest;

  const user = await getUserByUsername(username);
  if (!user) {
    res.sendStatus(403); // 403 Not Found - username doesn't exist
    return;
  }

  const { passwordHash } = user;
  if (!(await argon2.verify(passwordHash, password))) {
    res.sendStatus(403); // 403 Not Found - pass doesn't match
    return;
  }
  await req.session.clearSession();

  // add data to the session
  req.session.authenticatedUser = {
    userId: user.userId,
    username: user.username,
    isPro: user.isPro,
    isAdmin: user.isAdmin,
  };

  req.session.isLoggedIn = true;
  res.sendStatus(200);
}

export { getUser, getAllUsers, registerUser, logIn };
