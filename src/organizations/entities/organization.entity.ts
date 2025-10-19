import { User } from '../../users/entities/user.entity';
import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'organizations' })
export class Organization {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ nullable: false, length: 32 })
	name: string;

	@ManyToOne(() => User, (user) => user.organizations, { eager: false })
	@JoinColumn({ name: 'owner_id' })
	owner: User;

	@CreateDateColumn()
	createdAt: Date;
}
