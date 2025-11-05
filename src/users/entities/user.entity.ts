import { Task } from '../../tasks/entities/task.entity';
import { Membership } from '../../memberships/entities/membership.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	UpdateDateColumn,
	OneToMany,
} from 'typeorm';

@Entity({ name: 'users' })
export class User {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ nullable: false, unique: true })
	username: string;

	@Column({ name: 'first_name', nullable: false })
	firstName: string;

	@Column({ name: 'last_name', nullable: false })
	lastName: string;

	@Column({ unique: true })
	email: string;

	@Column({ nullable: false })
	password: string;

	@OneToMany(() => Organization, (organizations) => organizations.owner, {
		cascade: true,
	})
	organizations?: Organization[];

	@OneToMany(() => Membership, (membership) => membership.user)
	memberships?: Membership[];

	@OneToMany(() => Task, (task) => task.assignee)
	tasks?: Task[];

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt: Date;
}
