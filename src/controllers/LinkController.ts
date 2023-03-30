import { Request, Response } from 'express';
import { createLinkId, createNewLink } from '../models/LinkModel';
import { getUserById } from '../models/UserModel';
import { parseDatabaseError } from '../utils/db-utils';

async function shortenUrl(req: Request, res: Response): Promise<void> {
  // Make sure the user is logged in
  // send the appropriate response
  if (!req.session.isLoggedIn) {
    res.sendStatus(401);
  }

  // Get the userId from `req.session`
  const { authenticatedUserForPro } = req.session;

  // Retrieve the user's account data using their ID
  const user = await getUserById(authenticatedUserForPro.userId);

  if (!user) {
    res.sendStatus(404);
  }

  // Check if the user is neither a "pro" nor an "admin" account
  // check how many links they've already generated
  // if they have generated 5 links
  // send the appropriate response
  if (!user.isPro && !user.isAdmin) {
    const userLinks = user.links;
    if (userLinks.length >= 5) {
      res.sendStatus(403);
    }
  }

  // Generate a `linkId`
  // Add the new link to the database (wrap this in try/catch)
  // Respond with status 201 if the insert was successful
  const linkId = createLinkId(req.body.originalUrl, req.body.userId);

  try {
    await createNewLink(req.body.originalUrl, linkId, req.body.user);
  } catch (err) {
    console.error(err);
    const databaseErrorMessage = parseDatabaseError(err);
    res.status(500).json(databaseErrorMessage);
  }

  res.sendStatus(201);
}

export { shortenUrl };
