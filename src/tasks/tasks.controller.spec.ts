import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskStatus } from './entities/task.entity';
import { JwtService } from '@nestjs/jwt';

describe('TasksController', () => {
	let controller: TasksController;
	let service: jest.Mocked<TasksService>;

	const mockTasksService = {
		create: jest.fn(),
		findOne: jest.fn(),
		update: jest.fn(),
		remove: jest.fn(),
	};

	const user = { id: 'user-1' };
	const req = { user } as any;
	const taskId = 'task-1';

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [TasksController],
			providers: [
				{
					provide: TasksService,
					useValue: mockTasksService,
				},
				{
					provide: JwtService,
					useValue: {
						verifyAsync: jest.fn(),
						signAsync: jest.fn(),
					},
				},
			],
		}).compile();

		controller = module.get<TasksController>(TasksController);
		service = module.get(TasksService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('create', () => {
		it('should call service.create with correct arguments', async () => {
			const dto: CreateTaskDto = {
				name: 'Task 1',
				description: 'Desc',
				projectId: 'proj-1',
				assigneeId: 'user-2',
				status: TaskStatus.TODO,
				color: '#ff00ff',
				dueDate: new Date().toISOString(),
			};

			const expectedResult = { id: taskId, ...dto };
			mockTasksService.create.mockResolvedValueOnce(expectedResult as any);

			const result = await controller.create(req, dto);

			expect(service.create).toHaveBeenCalledWith(dto, user.id);
			expect(result).toEqual(expectedResult);
		});
	});

	describe('findOne', () => {
		it('should call service.findOne with correct id', async () => {
			const task = { id: taskId, name: 'Test Task' };
			mockTasksService.findOne.mockResolvedValueOnce(task as any);

			const result = await controller.findOne(req, taskId);

			expect(service.findOne).toHaveBeenCalledWith(taskId, req.user.id);
			expect(result).toEqual(task);
		});
	});

	describe('update', () => {
		it('should call service.update with correct parameters', async () => {
			const updateDto: UpdateTaskDto = { name: 'Updated Task' };
			const updatedTask = { id: taskId, name: 'Updated Task' };
			mockTasksService.update.mockResolvedValueOnce(updatedTask as any);

			const result = await controller.update(req, taskId, updateDto);

			expect(service.update).toHaveBeenCalledWith(taskId, updateDto, user.id);
			expect(result).toEqual(updatedTask);
		});
	});

	describe('remove', () => {
		it('should call service.remove with correct parameters', async () => {
			const deletedTask = { id: taskId };
			mockTasksService.remove.mockResolvedValueOnce(deletedTask as any);

			const result = await controller.remove(req, taskId);

			expect(service.remove).toHaveBeenCalledWith(taskId, user.id);
			expect(result).toEqual(deletedTask);
		});
	});
});
