import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { Repository } from 'typeorm';
import { Task, TaskStatus } from './entities/task.entity';
import { Project } from '../projects/entities/project.entity';
import { User } from '../users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Membership } from '../memberships/entities/membership.entity';

describe('TasksService', () => {
	let service: TasksService;
	let taskRepo: jest.Mocked<Repository<Task>>;
	let projectRepo: jest.Mocked<Repository<Project>>;
	let userRepo: jest.Mocked<Repository<User>>;
	let membershipRepo: jest.Mocked<Repository<Membership>>;

	const mockRepo = () => ({
		findOne: jest.fn(),
		find: jest.fn(),
		create: jest.fn(),
		save: jest.fn(),
		remove: jest.fn(),
		createQueryBuilder: jest.fn(),
	});

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				TasksService,
				{ provide: getRepositoryToken(Task), useValue: mockRepo() },
				{ provide: getRepositoryToken(Project), useValue: mockRepo() },
				{ provide: getRepositoryToken(User), useValue: mockRepo() },
				{ provide: getRepositoryToken(Membership), useValue: mockRepo() },
			],
		}).compile();

		service = module.get<TasksService>(TasksService);
		taskRepo = module.get(getRepositoryToken(Task));
		projectRepo = module.get(getRepositoryToken(Project));
		userRepo = module.get(getRepositoryToken(User));
		membershipRepo = module.get(getRepositoryToken(Membership));
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('create', () => {
		it('should create and save a task', async () => {
			const createTaskDto: CreateTaskDto = {
				projectId: 'project-1',
				assigneeId: 'user-1',
				name: 'Task 1',
				description: 'Do things',
				dueDate: new Date().toISOString(),
			};

			const user = { id: 'user-1' } as User;
			const project = {
				id: 'project-1',
				organization: { owner: { id: 'user-1' } },
			} as Project;
			const task = {
				id: 'task-1',
				...createTaskDto,
				assignee: user,
				project,
			} as unknown as Task;

			projectRepo.findOne.mockResolvedValue(project);
			userRepo.findOne.mockResolvedValue(user);
			taskRepo.create.mockReturnValue(task);
			taskRepo.save.mockResolvedValue(task);

			const result = await service.create(createTaskDto, 'user-1');

			expect(projectRepo.findOne).toHaveBeenCalledWith({
				where: {
					id: createTaskDto.projectId,
					organization: { owner: { id: 'user-1' } },
				},
				select: ['id'],
			});
			expect(userRepo.findOne).toHaveBeenCalledWith({
				where: { id: createTaskDto.assigneeId },
				select: ['id'],
			});
			expect(taskRepo.create).toHaveBeenCalledWith(
				expect.objectContaining({
					name: createTaskDto.name,
					description: createTaskDto.description,
					project: { id: createTaskDto.projectId },
					assignee: { id: user.id },
					dueDate: expect.any(Date),
				}),
			);
			expect(taskRepo.save).toHaveBeenCalledWith(task);
			expect(result).toEqual(task);
		});

		it('should throw ForbiddenException if user is not allowed to create task', async () => {
			const createTaskDto: CreateTaskDto = {
				projectId: 'project-1',
				assigneeId: 'user-1',
				name: 'Task 1',
				description: 'Do things',
				dueDate: new Date().toISOString(),
			};

			projectRepo.findOne.mockResolvedValue(null);

			await expect(service.create(createTaskDto, 'user-1')).rejects.toThrow(
				ForbiddenException,
			);
		});

		it('should throw NotFoundException if assignee not found', async () => {
			const createTaskDto: CreateTaskDto = {
				projectId: 'project-1',
				assigneeId: 'user-1',
				name: 'Task 1',
				description: 'Do things',
				dueDate: new Date().toISOString(),
			};
			const project = {
				id: 'project-1',
				organization: { owner: { id: 'user-1' } },
			} as Project;

			projectRepo.findOne.mockResolvedValue(project);
			userRepo.findOne.mockResolvedValue(null);

			await expect(service.create(createTaskDto, 'user-1')).rejects.toThrow(
				NotFoundException,
			);
		});
	});

	describe('update', () => {
		it('should update the task if the user is the owner', async () => {
			const updateTaskDto: UpdateTaskDto = { name: 'Updated Task' };
			const task = {
				id: 'task-1',
				project: { organization: { owner: { id: 'user-1' } } },
			} as Task;

			taskRepo.findOne.mockResolvedValue(task);
			taskRepo.save.mockResolvedValue({
				...task,
				...updateTaskDto,
			} as unknown as Task);

			const result = await service.update('task-1', updateTaskDto, 'user-1');

			expect(taskRepo.save).toHaveBeenCalledWith({ ...task, ...updateTaskDto });
			expect(result).toEqual({ ...task, ...updateTaskDto });
		});

		it('should throw ForbiddenException if owner tries to update status', async () => {
			const updateTaskDto: UpdateTaskDto = { status: TaskStatus.DONE };
			const task = {
				id: 'task-1',
				project: { organization: { owner: { id: 'user-1' } } },
			} as Task;

			taskRepo.findOne.mockResolvedValue(task);

			await expect(
				service.update('task-1', updateTaskDto, 'user-1'),
			).rejects.toThrow(ForbiddenException);
		});

		it('should update the task if the user is the assignee', async () => {
			const updateTaskDto: UpdateTaskDto = { status: TaskStatus.IN_PROGRESS };
			const task = {
				id: 'task-1',
				project: { organization: { owner: { id: 'owner-1' } } },
				assignee: { id: 'user-1' },
			} as Task;

			taskRepo.findOne.mockResolvedValue(task);
			taskRepo.save.mockResolvedValue({
				...task,
				...updateTaskDto,
			} as unknown as Task);

			const result = await service.update('task-1', updateTaskDto, 'user-1');

			expect(taskRepo.save).toHaveBeenCalledWith({ ...task, ...updateTaskDto });
			expect(result).toEqual({ ...task, ...updateTaskDto });
		});

		it('should throw ForbiddenException if assignee tries to update forbidden fields', async () => {
			const updateTaskDto: UpdateTaskDto = { assigneeId: 'user-2' };
			const task = {
				id: 'task-1',
				project: { organization: { owner: { id: 'owner-1' } } },
				assignee: { id: 'user-1' },
			} as Task;

			taskRepo.findOne.mockResolvedValue(task);

			await expect(
				service.update('task-1', updateTaskDto, 'user-1'),
			).rejects.toThrow(ForbiddenException);
		});

		it('should throw ForbiddenException if neither owner nor assignee', async () => {
			const updateTaskDto: UpdateTaskDto = { name: 'Updated Task' };
			const task = {
				id: 'task-1',
				project: { organization: { owner: { id: 'owner-1' } } },
				assignee: { id: 'user-2' },
			} as Task;

			taskRepo.findOne.mockResolvedValue(task);

			await expect(
				service.update('task-1', updateTaskDto, 'user-1'),
			).rejects.toThrow(ForbiddenException);
		});
	});

	describe('remove', () => {
		it('should remove the task if allowed', async () => {
			const task = {
				id: 'task-1',
				project: { organization: { owner: { id: 'user-1' } } },
			} as Task;

			taskRepo.findOne.mockResolvedValue(task);
			taskRepo.remove.mockResolvedValue(task);

			await expect(service.remove('task-1', 'user-1')).resolves.toBeUndefined();
			expect(taskRepo.remove).toHaveBeenCalledWith(task);
		});

		it('should throw NotFoundException if task not found', async () => {
			taskRepo.findOne.mockResolvedValue(null);

			await expect(service.remove('task-1', 'user-1')).rejects.toThrow(
				NotFoundException,
			);
		});
	});

	describe('findOne', () => {
		it('should return the task', async () => {
			const task = {
				id: 'task-1',
				assignee: { id: 'id-123' },
				name: 'Task 1',
			} as Task;
			const userId = 'id-123';

			taskRepo.findOne.mockResolvedValue(task);

			const result = await service.findOne('task-1', userId);
			expect(result).toEqual(task);
		});

		it('should throw NotFoundException if task not found', async () => {
			taskRepo.findOne.mockResolvedValue(null);

			await expect(service.findOne('task-1', 'id-123')).rejects.toThrow(
				NotFoundException,
			);
		});
	});

	describe('findAllProjectTasks', () => {
		it('should return all tasks for owner', async () => {
			const project = {
				id: 'project-1',
				organization: { id: 'org-1', owner: { id: 'user-1' } },
			} as any;

			const mockQueryBuilder: any = {
				leftJoinAndSelect: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis(),
				select: jest.fn().mockReturnThis(),
				orderBy: jest.fn().mockReturnThis(),
				andWhere: jest.fn().mockReturnThis(),
				getMany: jest.fn().mockResolvedValue([{ id: 'task-1' }]),
			};

			projectRepo.findOne.mockResolvedValue(project);
			taskRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

			const result = await service.findAllProjectTasks('project-1', 'user-1');

			expect(projectRepo.findOne).toHaveBeenCalled();
			expect(mockQueryBuilder.andWhere).not.toHaveBeenCalled();
			expect(result).toEqual([{ id: 'task-1' }]);
		});

		it('should return only assignee tasks for member', async () => {
			const project = {
				id: 'project-1',
				organization: { id: 'org-1', owner: { id: 'owner-1' } },
			} as any;

			const mockQueryBuilder: any = {
				leftJoinAndSelect: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis(),
				select: jest.fn().mockReturnThis(),
				orderBy: jest.fn().mockReturnThis(),
				andWhere: jest.fn().mockReturnThis(),
				getMany: jest.fn().mockResolvedValue([{ id: 'task-1' }]),
			};

			projectRepo.findOne.mockResolvedValue(project);
			membershipRepo.findOne.mockResolvedValue({
				id: 'membership-1',
			} as Membership);
			taskRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

			const result = await service.findAllProjectTasks('project-1', 'member-1');

			expect(membershipRepo.findOne).toHaveBeenCalledWith({
				where: {
					user: { id: 'member-1' },
					organization: { id: 'org-1' },
				},
			});
			expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
				'assignee.id = :userId',
				{ userId: 'member-1' },
			);
			expect(result).toEqual([{ id: 'task-1' }]);
		});

		it('should throw ForbiddenException if user not a member', async () => {
			const project = {
				id: 'project-1',
				organization: { id: 'org-1', owner: { id: 'owner-1' } },
			} as any;

			projectRepo.findOne.mockResolvedValue(project);
			membershipRepo.findOne.mockResolvedValue(null);

			await expect(
				service.findAllProjectTasks('project-1', 'user-x'),
			).rejects.toThrow(ForbiddenException);
		});

		it('should throw NotFoundException if project not found', async () => {
			projectRepo.findOne.mockResolvedValue(null);

			await expect(
				service.findAllProjectTasks('invalid', 'user-1'),
			).rejects.toThrow(NotFoundException);
		});
	});

	describe('findAllUsersTasks', () => {
		it('should return tasks assigned to the user in the project', async () => {
			const tasks = [
				{ id: 'task-1', name: 'T1' },
				{ id: 'task-2', name: 'T2' },
			];

			taskRepo.find.mockResolvedValue(tasks as Task[]);

			const result = await service.findAllUsersTasks('user-1', 'project-1');

			expect(taskRepo.find).toHaveBeenCalledWith({
				where: {
					project: { id: 'project-1' },
					assignee: { id: 'user-1' },
				},
			});
			expect(result).toEqual(tasks);
		});
	});
});
