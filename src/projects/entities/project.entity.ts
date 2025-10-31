import { Organization } from '../../organizations/entities/organization.entity';
import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
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
	@JoinColumn({ name: 'organization_id' })
	organization: Organization;

	@Column({ name: 'name' })
	name: string;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;
}
