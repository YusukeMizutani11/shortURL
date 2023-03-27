import{Entity, PrimaryColumn, Column, OneToOne, Relation} from 'typeorm';
import { User } from './User';

@Entity()
export class Link {
  @PrimaryColumn()
  linkId: string;

  @Column()
  originalUrl: string;

  @Column()
  lastAccessedDate: Date;

  @Column({default: 0})
  numHits: number;

  @OneToOne(() => User, (user) => user.link)
  user: Relation<Link>;
}

