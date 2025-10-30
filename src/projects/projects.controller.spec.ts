import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { JwtService } from '@nestjs/jwt';

describe('ProjectsController', () => {
	let controller: ProjectsController;
	let service: ProjectsService;

	const mockProjectsService = {
		create: jest.fn(),
		findOne: jest.fn(),
		update: jest.fn(),
		remove: jest.fn(),
	};

	const user = { id: 'user-1' };
	const req = { user } as any;
	const projectId = 'proj-1';

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [ProjectsController],
			providers: [
				{
					provide: ProjectsService,
					useValue: mockProjectsService,
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

		controller = module.get<ProjectsController>(ProjectsController);
		service = module.get<ProjectsService>(ProjectsService);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('create', () => {
		it('should call service.create with correct arguments', async () => {
			const dto: CreateProjectDto = {
				organizationId: 'org-1',
				name: 'Project X',
			};
			const result = { id: projectId, ...dto };
			mockProjectsService.create.mockResolvedValue(result);

			const response = await controller.create(req, dto);

			expect(service.create).toHaveBeenCalledWith(dto, user.id);
			expect(response).toEqual(result);
		});
	});

	describe('findOne', () => {
		it('should call service.findOne with correct id and userId', async () => {
			const project = { id: projectId, name: 'Test Project' };
			mockProjectsService.findOne.mockResolvedValue(project);

			const result = await controller.findOne(req, projectId);

			expect(service.findOne).toHaveBeenCalledWith(projectId, user.id);
			expect(result).toEqual(project);
		});
	});

	describe('update', () => {
		it('should call service.update with correct parameters', async () => {
			const updateDto = { name: 'Updated Project' };
			const updatedProject = { id: projectId, name: updateDto.name };
			mockProjectsService.update.mockResolvedValue(updatedProject);

			const result = await controller.update(projectId, req, updateDto);

			expect(service.update).toHaveBeenCalledWith(
				projectId,
				updateDto.name,
				user.id,
			);
			expect(result).toEqual(updatedProject);
		});
	});

	describe('remove', () => {
		it('should call service.remove with correct parameters', async () => {
			const deletedProject = { id: projectId, name: 'Deleted Project' };
			mockProjectsService.remove.mockResolvedValue(deletedProject);

			const result = await controller.remove(req, projectId);

			expect(service.remove).toHaveBeenCalledWith(projectId, user.id);
			expect(result).toEqual(deletedProject);
		});
	});
});
