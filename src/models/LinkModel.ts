import { createHash } from 'crypto';
import { AppDataSource } from '../dataSource';
import { Link } from '../entities/Link';

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

export { getLinkById, createLinkId };
