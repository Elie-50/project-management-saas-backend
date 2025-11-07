import { User } from '../../users/entities/user.entity';
import { Project } from '../../projects/entities/project.entity';
import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';

export enum TaskStatus {
	TODO = 'To Do',
	IN_PROGRESS = 'In Progress',
	DONE = 'Done',
}

@Entity({ name: 'tasks' })
export class Task {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ nullable: false, length: 50 })
	name: string;

	@Column({ nullable: false, type: 'text' })
	description: string;

	@ManyToOne(() => Project, (project) => project.tasks)
	@JoinColumn({ name: 'project_id' })
	project: Project;

	@ManyToOne(() => User, (user) => user.tasks)
	@JoinColumn({ name: 'assignee_id' })
	assignee: User;

	@Column({
		type: 'enum',
		enum: TaskStatus,
		default: TaskStatus.TODO,
	})
	status: TaskStatus;

	@Column({ length: 7, default: '#ffffff' })
	color: string;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt: Date;

	@Column({ name: 'due_date', type: 'timestamptz', nullable: false })
	dueDate: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt: Date;
}
