import { Request, Response } from 'express';
import {
  getLinkById,
  createLinkId,
  createNewLink,
  updateLinkVisits,
  getLinksByUserId,
  getLinksByUserIdForOwnAccount,
  linkBelongsToUser,
  deleteLinkById,
} from '../models/LinkModel';
import { getUserById } from '../models/UserModel';
import { parseDatabaseError } from '../utils/db-utils';

async function shortenUrl(req: Request, res: Response): Promise<void> {
  // Make sure the user is logged in
  // send the appropriate response
  if (!req.session.isLoggedIn) {
    res.sendStatus(401);
    return;
  }

  // Get the userId from `req.session`
  const { authenticatedUser } = req.session;

  // Retrieve the user's account data using their ID
  const user = await getUserById(authenticatedUser.userId);

  if (!user) {
    res.sendStatus(404);
    return;
  }

  // Check if the user is neither a "pro" nor an "admin" account
  // check how many links they've already generated
  // if they have generated 5 links
  // send the appropriate response
  if (!user.isPro && !user.isAdmin) {
    const userLinks = user.links;
    if (userLinks.length >= 5) {
      res.sendStatus(403);
      return;
    }
  }

  // Generate a `linkId`
  // Add the new link to the database (wrap this in try/catch)
  // Respond with status 201 if the insert was successful
  const { originalUrl } = req.body as NewLinkRequest;
  const linkId = createLinkId(originalUrl, user.userId);
  try {
    await createNewLink(originalUrl, linkId, user);
  } catch (err) {
    console.error(err);
    const databaseErrorMessage = parseDatabaseError(err);
    res.status(500).json(databaseErrorMessage);
  }

  res.sendStatus(201);
}

async function getOriginalUrl(req: Request, res: Response): Promise<void> {
  // Retrieve the link data using the targetLinkId from the path parameter
  const { targetLinkId } = req.params as LinkedIdParams;

  // Check if you got back `null`
  // send the appropriate response
  if (!targetLinkId) {
    res.sendStatus(404);
    return;
  }

  let targetLink = await getLinkById(targetLinkId);

  // Call the appropriate function to increment the number of hits and the last accessed date
  targetLink = await updateLinkVisits(targetLink);

  // Redirect the client to the original URL
  res.redirect(targetLink.originalUrl);
}

async function getLinks(req: Request, res: Response): Promise<void> {
  const { authenticatedUser } = req.session;
  const user = await getUserById(authenticatedUser.userId);

  if (!user) {
    res.sendStatus(404);
    return;
  }

  if (authenticatedUser.isAdmin) {
    res.json(await getLinksByUserIdForOwnAccount(user.userId));
  } else {
    res.json(await getLinksByUserId(user.userId));
  }
}

async function deleteUserLink(req: Request, res: Response): Promise<void> {
  const { isLoggedIn, authenticatedUser } = req.session;
  if (!isLoggedIn) {
    res.sendStatus(401); // 401 Unauthorized
    return;
  }

  const { targetLinkId } = req.params as LinkedIdParams;

  const linkExists = getLinkById(targetLinkId);
  if (!linkExists) {
    res.sendStatus(404);
    return;
  }

  const linkExistsInUser = await linkBelongsToUser(targetLinkId, authenticatedUser.userId);
  if (!linkExistsInUser) {
    res.sendStatus(403); // 403 Forbidden
    return;
  }

  await deleteLinkById(targetLinkId);
  res.sendStatus(200); // successfully deleted
}

export { shortenUrl, getOriginalUrl, getLinks, deleteUserLink };
