import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { User } from '../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { Organization } from './entities/organization.entity';
import { MembershipsService } from '../memberships/memberships.service';
import { ProjectsService } from '../projects/projects.service';
import { Project } from '../projects/entities/project.entity';

describe('OrganizationsController', () => {
	let controller: OrganizationsController;
	let service: jest.Mocked<OrganizationsService>;
	let membershipService: jest.Mocked<MembershipsService>;
	let projectService: jest.Mocked<ProjectsService>;

	const mockUser: User = {
		id: 'user-id-123',
		email: 'test@example.com',
		password: '$2b$10$hashedPassword',
		username: 'user123',
		firstName: 'Test',
		lastName: 'User',
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	const mockReq = {
		user: mockUser,
	} as any;

	const mockService = {
		create: jest.fn(),
		findAll: jest.fn(),
		findOne: jest.fn(),
		update: jest.fn(),
		remove: jest.fn(),
	};

	const mockMembershipService = {
		create: jest.fn(),
		remove: jest.fn(),
		findAllMembers: jest.fn(),
	};

	const mockProjectService = {
		findAll: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [OrganizationsController],
			providers: [
				{
					provide: OrganizationsService,
					useValue: mockService,
				},
				{
					provide: MembershipsService,
					useValue: mockMembershipService,
				},
				{
					provide: ProjectsService,
					useValue: mockProjectService,
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

		controller = module.get<OrganizationsController>(OrganizationsController);
		service = module.get(OrganizationsService);
		membershipService = module.get(MembershipsService);
		projectService = module.get(ProjectsService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('create', () => {
		it('should call service.create with correct args', async () => {
			const dto: CreateOrganizationDto = { name: 'Org A' };
			const expected = {
				id: 'org-1',
				name: 'Org A',
				owner: mockUser,
				createdAt: new Date(),
			};

			service.create.mockResolvedValue(expected);

			const result = await controller.create(dto, mockReq);

			expect(service.create).toHaveBeenCalledWith(dto, mockUser.id);
			expect(result).toEqual(expected);
		});
	});

	describe('findAll', () => {
		it('should return organizations for user', async () => {
			const expected = [
				{ id: 'org-1', name: 'Org A', owner: mockUser, createdAt: new Date() },
			];

			service.findAll.mockResolvedValue(expected);

			const result = await controller.findAll(mockReq);

			expect(service.findAll).toHaveBeenCalledWith(mockUser.id);
			expect(result).toEqual(expected);
		});
	});

	describe('findOne', () => {
		it('should return a single organization', async () => {
			const expected = {
				id: 'org-1',
				name: 'Org A',
				owner: mockUser,
				createdAt: new Date(),
			};

			service.findOne.mockResolvedValue(expected);

			const result = await controller.findOne('org-1', mockReq);

			expect(service.findOne).toHaveBeenCalledWith('org-1', mockUser.id);
			expect(result).toEqual(expected);
		});
	});

	describe('update', () => {
		it('should call service.update with correct args', async () => {
			const dto: UpdateOrganizationDto = { name: 'Updated Org' };
			const ownerId = 'owner-123';
			const expected = {
				id: 'org-123',
				createdAt: new Date(),
				owner: { id: ownerId } as User,
				...dto,
			} as Organization;

			service.update.mockResolvedValue(expected);

			const result = await controller.update('org-1', mockReq, dto);

			expect(service.update).toHaveBeenCalledWith('org-1', mockUser.id, dto);
			expect(result).toEqual(expected);
		});
	});

	describe('remove', () => {
		it('should call service.remove with correct args', async () => {
			const expected = {
				id: 'org-1',
				name: 'Org A',
				owner: mockUser,
				createdAt: new Date(),
			};

			service.remove.mockResolvedValue(expected);

			const result = await controller.remove('org-1', mockReq);

			expect(service.remove).toHaveBeenCalledWith('org-1', mockUser.id);
			expect(result).toEqual(expected);
		});
	});

	describe('addMember', () => {
		it('should call membershipService.create with correct args', async () => {
			const dto = { userId: 'user-123' };
			const orgId: string = 'org-123';
			const expected = {
				id: 'id',
				user: { id: 'user-123' } as User,
				organization: { id: 'org-123' } as Organization,
				joinedAt: new Date(),
			};

			membershipService.create.mockResolvedValue(expected);

			const result = await controller.addMember(orgId, dto);

			expect(membershipService.create).toHaveBeenCalledWith({
				organizationId: orgId,
				userId: dto.userId,
			});

			expect(result).toEqual(expected);
		});
	});

	describe('findAllMembers', () => {
		it('should return all organization members', async () => {
			const expected = [
				{
					id: 'id-123',
					username: 'user',
					email: 'user@example.com',
					joinedAt: new Date(),
				},
			];

			const orgId: string = 'org-123';

			membershipService.findAllMembers.mockResolvedValue(expected);

			const result = await controller.findAllMembers(orgId);

			expect(membershipService.findAllMembers).toHaveBeenCalledWith(orgId);
			expect(result).toEqual(expected);
		});
	});

	describe('removeMember', () => {
		it('should call membershipService.remove with correct args', async () => {
			await controller.removeMember('org-1', 'user-1');

			expect(membershipService.remove).toHaveBeenCalledWith('org-1', 'user-1');
		});
	});

	describe('findAllProjects', () => {
		it('should return all organization projects', async () => {
			const expected = [
				{
					id: 'id-123',
					name: 'project',
					organization: {
						id: 'id-123',
						name: 'Org-1',
					} as Organization,
				} as Project,
			];

			const orgId: string = 'org-123';

			projectService.findAll.mockResolvedValue(expected);

			const result = await controller.findAllProjects(mockReq, orgId);

			expect(projectService.findAll).toHaveBeenCalledWith(
				orgId,
				mockReq.user.id,
			);

			expect(result).toEqual(expected);
		});
	});
});
