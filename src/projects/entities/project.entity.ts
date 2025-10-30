import { Organization } from '../../organizations/entities/organization.entity';
import {
	Column,
	CreateDateColumn,
	Entity,
	ManyToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'projects' })
export class Project {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@ManyToOne(() => Organization, (organization) => organization.projects, {
		eager: false,
	})
	organization: Organization;

	@Column({ name: 'name' })
	name: string;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;
}
