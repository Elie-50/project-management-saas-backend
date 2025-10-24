import {
	Entity,
	JoinColumn,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	ManyToOne,
	Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Organization } from '../../organizations/entities/organization.entity';

@Unique(['user', 'organization'])
@Entity({ name: 'memberships' })
export class Membership {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@ManyToOne(() => User, (user) => user.memberships)
	@JoinColumn({ name: 'user_id' })
	user: User;

	@ManyToOne(() => Organization, (org) => org.memberships)
	@JoinColumn({ name: 'organization_id' })
	organization: Organization;

	@CreateDateColumn({ name: 'joined_at' })
	joinedAt: Date;
}
