import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { Membership } from '../memberships/entities/membership.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('ProjectsService', () => {
	let service: ProjectsService;
	let mockProjectsRepository: jest.Mocked<Repository<Project>>;
	let mockOrganizationsRepository: jest.Mocked<Repository<Organization>>;
	let mockMembershipRepository: jest.Mocked<Repository<Membership>>;

	const mockOrgRepo = {
		findOne: jest.fn(),
	};

	const mockMembershipRepo = {
		findOne: jest.fn(),
	};

	const mockRepo = {
		create: jest.fn(),
		save: jest.fn(),
		find: jest.fn(),
		findOne: jest.fn(),
		remove: jest.fn(),
	};

	const userId = 'user-1';
	const organizationId = 'org-1';
	const projectId = 'proj-1';

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ProjectsService,
				{
					provide: getRepositoryToken(Project),
					useValue: mockRepo,
				},
				{
					provide: getRepositoryToken(Organization),
					useValue: mockOrgRepo,
				},
				{
					provide: getRepositoryToken(Membership),
					useValue: mockMembershipRepo,
				},
			],
		}).compile();

		service = module.get<ProjectsService>(ProjectsService);
		mockProjectsRepository = module.get(getRepositoryToken(Project));
		mockOrganizationsRepository = module.get(getRepositoryToken(Organization));
		mockMembershipRepository = module.get(getRepositoryToken(Membership));
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('create', () => {
		it('should create a project if user owns the organization', async () => {
			const dto = { organizationId, name: 'New Project' };

			const org = { id: organizationId } as Organization;

			mockOrganizationsRepository.findOne.mockResolvedValue({
				id: organizationId,
			} as Organization);

			mockProjectsRepository.save.mockResolvedValue({
				id: projectId,
				...dto,
			} as unknown as Project);

			const createdProject = {
				name: 'New Project',
				organization: { id: organizationId } as Organization,
			};

			mockProjectsRepository.create.mockReturnValue(createdProject as Project);

			const result = await service.create(dto as any, userId);

			expect(mockOrganizationsRepository.findOne).toHaveBeenCalledWith({
				where: { id: organizationId, owner: { id: userId } },
			});

			expect(mockProjectsRepository.create).toHaveBeenCalledWith({
				name: dto.name,
				organization: org,
			});

			expect(mockProjectsRepository.save).toHaveBeenCalledWith({
				name: dto.name,
				organization: org,
			});

			expect(result).toEqual({
				id: projectId,
				name: dto.name,
				organizationId: org.id,
			});
		});

		it('should throw ForbiddenException if user is not org owner', async () => {
			const dto = { organizationId, name: 'New Project' };
			mockOrganizationsRepository.findOne.mockResolvedValue(null);

			await expect(service.create(dto as any, userId)).rejects.toThrow(
				ForbiddenException,
			);
		});
	});

	describe('findAll', () => {
		it('should return all projects if user is a member', async () => {
			mockMembershipRepository.findOne.mockResolvedValue({
				id: 'member-1',
			} as Membership);
			mockProjectsRepository.find.mockResolvedValue([
				{ id: projectId } as Project,
			]);

			const result = await service.findAll(organizationId, userId);

			expect(mockProjectsRepository.find).toHaveBeenCalledWith({
				where: { organization: { id: organizationId } },
			});
			expect(result).toEqual([{ id: projectId }]);
		});

		it('should return all projects if user is the owner', async () => {
			mockMembershipRepository.findOne.mockResolvedValue(null);
			mockOrganizationsRepository.findOne.mockResolvedValue({
				id: organizationId,
			} as Organization);
			mockProjectsRepository.find.mockResolvedValue([
				{ id: projectId } as Project,
			]);

			const result = await service.findAll(organizationId, userId);

			expect(result).toEqual([{ id: projectId }]);
		});

		it('should throw ForbiddenException if user is neither member nor owner', async () => {
			mockMembershipRepository.findOne.mockResolvedValue(null);
			mockOrganizationsRepository.findOne.mockResolvedValue(null);

			await expect(service.findAll(organizationId, userId)).rejects.toThrow(
				ForbiddenException,
			);
		});
	});

	describe('findOne', () => {
		it('should return a project if user is member', async () => {
			const project = {
				id: projectId,
				organization: { id: organizationId },
			} as Project;
			mockProjectsRepository.findOne.mockResolvedValue(project);
			mockMembershipRepository.findOne.mockResolvedValue({
				id: 'member-1',
			} as Membership);

			const result = await service.findOne(projectId, userId);

			expect(result).toEqual(project);
		});

		it('should throw NotFoundException if project not found', async () => {
			mockProjectsRepository.findOne.mockResolvedValue(null);

			await expect(service.findOne(projectId, userId)).rejects.toThrow(
				NotFoundException,
			);
		});

		it('should throw ForbiddenException if user not in org', async () => {
			const project = {
				id: projectId,
				organization: { id: organizationId },
			} as Project;
			mockProjectsRepository.findOne.mockResolvedValue(project);
			mockMembershipRepository.findOne.mockResolvedValue(null);
			mockOrgRepo.findOne.mockResolvedValue(null);

			await expect(service.findOne(projectId, userId)).rejects.toThrow(
				ForbiddenException,
			);
		});
	});

	describe('update', () => {
		it('should update project name if authorized', async () => {
			const project = {
				id: projectId,
				organization: { id: organizationId },
				name: 'Old',
			};
			jest.spyOn(service, 'findOne').mockResolvedValue(project as any);
			mockProjectsRepository.save.mockResolvedValue({
				...project,
				name: 'New',
			} as Project);

			const result = await service.update(projectId, 'New', userId);

			expect(service.findOne).toHaveBeenCalledWith(projectId, userId);
			expect(mockProjectsRepository.save).toHaveBeenCalledWith({
				...project,
				name: 'New',
			});
			expect(result.name).toBe('New');
		});
	});

	describe('remove', () => {
		it('should remove project if authorized', async () => {
			const project = { id: projectId } as Project;
			jest.spyOn(service, 'findOne').mockResolvedValue(project as any);
			mockProjectsRepository.remove.mockResolvedValue(project);

			const result = await service.remove(projectId, userId);

			expect(service.findOne).toHaveBeenCalledWith(projectId, userId);
			expect(mockProjectsRepository.remove).toHaveBeenCalledWith(project);
			expect(result).toEqual(project);
		});
	});
});
