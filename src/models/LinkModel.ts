import { createHash } from 'crypto';
import { AppDataSource } from '../dataSource';
import { Link } from '../entities/Link';
import { User } from '../entities/User';

const linkRepository = AppDataSource.getRepository(Link);

// const md5 = createHash('md5');
// md5.update('https://youtube.com/watch?v=dQw4w9WgXcQ');
// const urlHash = md5.digest('base64url');
// const shortLinkId = urlHash.slice(0, 9);

// console.log(`MD5 Hash: ${urlHash}`);
// console.log(`linkId: ${shortLinkId}`);
// console.log(`MD5 Hash: ${urlHash}`);

async function getLinkById(linkId: string): Promise<Link | null> {
  const link = await linkRepository
    .createQueryBuilder('links')
    .leftJoinAndSelect('links.user', 'user')
    .where('links.linkId = :linkId', { linkId })
    .getOne();
  return link;
}

function createLinkId(originalUrl: string, userId: string): string {
  const md5 = createHash('md5');
  md5.update(originalUrl + userId);
  const urlHash = md5.digest('base64url');
  const linkId = urlHash.slice(0, 9);

  return linkId;
}

async function createNewLink(originalUrl: string, linkId: string, creator: User): Promise<Link> {
  const timeNow = new Date();
  let newLink = new Link();
  newLink.originalUrl = originalUrl;
  newLink.linkId = linkId;
  newLink.lastAccessedDate = timeNow;
  newLink.numHits = 0;
  newLink.user = creator;

  newLink = await linkRepository.save(newLink);
  return newLink;
}

async function updateLinkVisits(link: Link): Promise<Link> {
  const modifiedLink = link;
  // Increment the link's number of hits property
  modifiedLink.numHits += 1;

  // Create a new date object and assign it to the link's `lastAccessedOn` property.
  const now = new Date();
  modifiedLink.lastAccessedDate = now;

  // Update the link's numHits and lastAccessedOn in the database
  const updatedLink = await linkRepository.save(modifiedLink);

  // return the updated link
  return updatedLink;
}

// async function getLinksByUserId(userId: string): Promise<Link[]> {
//   const links = await linkRepository
//     .createQueryBuilder('link')
//     .where({ user: { userId } }) // NOTES: This is how you do nested WHERE clauses
//     .leftJoin('link.user', 'user')
//     .select([
//       'link.linkId',
//       'link.originalUrl',
//       'link.numHits',
//       'link.lastAccessedOn',
//       'link.user',
//       'user.userId',
//       'user.username',
//       'user.isPro',
//       'user.isAdmin',
//     ])
//     .getMany();
// }

//     const links = await linkRepository
//       .createQueryBuilder('link')
//       .where({ user: { userId } }) // NOTES: This is how you do nested WHERE clauses
//       .leftJoin('link.user', 'user')
//       .select([
//         'link.linkId',
//         'link.originalUrl',
//         'user',
//         'user.userId',
//         'user.username',
//         'user.isAdmin',
//       ])
//       .getMany();
//   }

//   return links;
// }

export { getLinkById, createLinkId, createNewLink, updateLinkVisits };
