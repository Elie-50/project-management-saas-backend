import { Task } from '../../tasks/entities/task.entity';
import { Organization } from '../../organizations/entities/organization.entity';
import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'projects' })
export class Project {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@ManyToOne(() => Organization, (organization) => organization.projects, {
		eager: false,
	})
	@JoinColumn({ name: 'organization_id' })
	organization: Organization;

	@Column({ name: 'name' })
	name: string;

	@OneToMany(() => Task, (task) => task.project)
	tasks?: Task[];

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;
}
