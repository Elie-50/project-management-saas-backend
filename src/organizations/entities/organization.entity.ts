import { User } from '../../users/entities/user.entity';
import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	OneToMany,
} from 'typeorm';
import { Membership } from '../../memberships/entities/membership.entity';
import { Project } from '../../projects/entities/project.entity';

@Entity({ name: 'organizations' })
export class Organization {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ nullable: false, length: 32 })
	name: string;

	@ManyToOne(() => User, (user) => user.organizations, { eager: false })
	@JoinColumn({ name: 'owner_id' })
	owner: User;

	@OneToMany(() => Membership, (membership) => membership.organization)
	memberships?: Membership[];

	@OneToMany(() => Project, (project) => project.organization)
	projects?: Project[];

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;
}
