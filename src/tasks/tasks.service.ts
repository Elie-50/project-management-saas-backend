import {
	ForbiddenException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { Project } from '../projects/entities/project.entity';
import { User } from '../users/entities/user.entity';
import { Membership } from '../memberships/entities/membership.entity';

@Injectable()
export class TasksService {
	constructor(
		@InjectRepository(Task)
		private readonly taskRepository: Repository<Task>,

		@InjectRepository(Project)
		private readonly projectRepository: Repository<Project>,

		@InjectRepository(User)
		private readonly userRepository: Repository<User>,

		@InjectRepository(Membership)
		private readonly membershipRepo: Repository<Membership>,
	) {}

	async create(createTaskDto: CreateTaskDto, userId: string) {
		const allowed = await this.projectRepository.findOne({
			where: {
				id: createTaskDto.projectId,
				organization: {
					owner: {
						id: userId,
					},
				},
			},
			select: ['id'],
		});

		if (!allowed) {
			throw new ForbiddenException('Cannot create task for this project');
		}

		const assignee = await this.userRepository.findOne({
			where: {
				id: createTaskDto.assigneeId,
			},
			select: ['id'],
		});

		if (!assignee) {
			throw new NotFoundException('User not found');
		}

		const dueDate = new Date(createTaskDto.dueDate);

		const task = this.taskRepository.create({
			...createTaskDto,
			project: { id: createTaskDto.projectId },
			assignee: { id: assignee.id },
			dueDate,
		});
		return this.taskRepository.save(task);
	}

	async findAllProjectTasks(projectId: string, userId: string) {
		const project = await this.projectRepository.findOne({
			where: { id: projectId },
			relations: ['organization', 'organization.owner'],
		});

		if (!project) {
			throw new NotFoundException('Project not found');
		}

		const isOwner = project.organization.owner.id === userId;

		// If not owner, check membership
		if (!isOwner) {
			const member = await this.membershipRepo.findOne({
				where: {
					user: { id: userId },
					organization: { id: project.organization.id },
				},
			});

			if (!member) {
				throw new ForbiddenException("Cannot view this project's tasks");
			}
		}

		// Base query
		const qb = this.taskRepository
			.createQueryBuilder('task')
			.where('task.project_id = :projectId', { projectId })
			.orderBy('task.createdAt', 'DESC');

		// Restrict to user's own tasks if not owner
		if (!isOwner) {
			qb.andWhere('task.assignee_id = :userId', { userId });
		} else {
			// If owner, join assignee info
			qb.leftJoinAndSelect('task.assignee', 'assignee').select([
				'task',
				'assignee.id',
				'assignee.username',
				'assignee.firstName',
				'assignee.lastName',
			]);
		}

		return qb.getMany();
	}

	async findOne(id: string, userId: string) {
		const task = await this.taskRepository.findOne({
			where: { id },
			relations: [
				'project',
				'project.organization',
				'project.organization.owner',
				'assignee',
			],
			select: {
				id: true,
				name: true,
				description: true,
				status: true,
				color: true,
				project: {
					id: true,
					organization: {
						id: true,
						owner: {
							id: true,
						},
					},
				},
				assignee: {
					id: true,
				},
			},
		});

		if (!task) {
			throw new NotFoundException('Task not found');
		}

		if (
			task.assignee.id !== userId &&
			task.project.organization.owner.id !== userId
		) {
			throw new ForbiddenException('Cannot view this task');
		}
		return task;
	}

	async update(id: string, updateTaskDto: UpdateTaskDto, userId: string) {
		const task = await this.taskRepository.findOne({
			where: { id },
			relations: [
				'project',
				'project.organization',
				'project.organization.owner',
				'assignee',
			],
		});

		if (!task) {
			throw new NotFoundException('Task not found');
		}

		const isOwner = task.project.organization.owner.id === userId;
		const isAssignee = task.assignee?.id === userId;

		if (isOwner) {
			if (updateTaskDto.status) {
				throw new ForbiddenException('Owner cannot update the task status');
			}
			Object.assign(task, updateTaskDto);
			return this.taskRepository.save(task);
		}

		if (isAssignee) {
			const forbiddenFields = [
				'assigneeId',
				'color',
				'description',
				'dueDate',
				'name',
				'projectId',
			];

			for (const field of forbiddenFields) {
				if (field in updateTaskDto) {
					throw new ForbiddenException(`Assignee cannot update '${field}'`);
				}
			}

			if (updateTaskDto.dueDate) {
				updateTaskDto.dueDate = new Date(updateTaskDto.dueDate);
			}

			Object.assign(task, updateTaskDto);
			return this.taskRepository.save(task);
		}

		throw new ForbiddenException('You are not allowed to update this task');
	}

	async remove(id: string, userId: string) {
		const task = await this.taskRepository.findOne({
			where: {
				id: id,
				project: {
					organization: {
						owner: {
							id: userId,
						},
					},
				},
			},
		});

		if (!task) {
			throw new NotFoundException('Task not found');
		}

		await this.taskRepository.remove(task);
	}
}
