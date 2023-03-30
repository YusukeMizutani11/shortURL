import { AppDataSource } from '../dataSource';
import { Link } from '../entities/Link';

const linkRepository = AppDataSource.getRepository(Link);

async function getLinkById(linkId: string): Promise<Link | null> {
  const link = await linkRepository
    .createQueryBuilder('links')
    .leftJoinAndSelect('links.user', 'user')
    .where('links.linkId = :linkId', { linkId })
    .getOne();
  return link;
}

export { getLinkById };
