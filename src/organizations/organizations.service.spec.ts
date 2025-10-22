import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsService } from './organizations.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Organization } from './entities/organization.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { User } from 'src/users/entities/user.entity';

describe('OrganizationsService', () => {
	let service: OrganizationsService;
	let repo: jest.Mocked<Repository<Organization>>;

	const mockRepo = {
		save: jest.fn(),
		find: jest.fn(),
		findOne: jest.fn(),
		update: jest.fn(),
		remove: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				OrganizationsService,
				{
					provide: getRepositoryToken(Organization),
					useValue: mockRepo,
				},
			],
		}).compile();

		service = module.get<OrganizationsService>(OrganizationsService);
		repo = module.get(getRepositoryToken(Organization));
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('create', () => {
		it('should save and return the organization', async () => {
			const dto: CreateOrganizationDto = { name: 'Test Org' };
			const ownerId = 'user-123';
			const savedOrg = {
				id: 'org-1',
				...dto,
				owner: { id: ownerId } as User,
				createdAt: new Date(),
			};

			repo.save.mockResolvedValue(savedOrg);

			const result = await service.create(dto, ownerId);

			expect(repo.save).toHaveBeenCalledWith({
				...dto,
				owner: { id: ownerId },
			});
			expect(result).toEqual(savedOrg);
		});
	});

	describe('findAll', () => {
		it('should return all organizations for a user', async () => {
			const ownerId = 'user-123';
			const orgs = [
				{
					id: 'org-1',
					name: 'Org A',
					owner: { id: ownerId } as User,
					createdAt: new Date(),
				},
			];

			repo.find.mockResolvedValue(orgs);

			const result = await service.findAll(ownerId);

			expect(repo.find).toHaveBeenCalledWith({
				where: { owner: { id: ownerId } },
				order: { createdAt: 'DESC' },
			});
			expect(result).toEqual(orgs);
		});
	});

	describe('findOne', () => {
		it('should return the organization if found', async () => {
			const org = {
				id: 'org-1',
				name: 'Org A',
				owner: { id: 'user-123' } as User,
				createdAt: new Date(),
			};

			repo.findOne.mockResolvedValue(org);

			const result = await service.findOne('org-1', 'user-123');

			expect(repo.findOne).toHaveBeenCalledWith({
				where: { id: 'org-1', owner: { id: 'user-123' } },
			});
			expect(result).toEqual(org);
		});

		it('should throw NotFoundException if not found', async () => {
			repo.findOne.mockResolvedValue(null);

			await expect(service.findOne('org-1', 'user-123')).rejects.toThrow(
				NotFoundException,
			);
		});
	});

	describe('update', () => {
		it('should call update with correct parameters', async () => {
			const dto: UpdateOrganizationDto = { name: 'Updated Org' as string };
			const ownerId = 'user-123';

			const org: Organization = {
				id: 'org-123',
				createdAt: new Date(),
				owner: { id: ownerId } as User,
				name: 'Org',
			};

			jest.spyOn(service, 'findOne').mockResolvedValue(org as any);

			const newOrg: Organization = { ...org, name: dto?.name } as Organization;
			repo.save.mockResolvedValue(newOrg);

			const result = await service.update('org-1', ownerId, dto);

			expect(repo.save).toHaveBeenCalledWith(newOrg);
			expect(result).toEqual(newOrg);
		});
	});

	describe('remove', () => {
		it('should remove the organization if found', async () => {
			const org = {
				id: 'org-1',
				name: 'To Be Deleted',
				owner: { id: 'user-123' },
			};

			jest.spyOn(service, 'findOne').mockResolvedValue(org as any);
			repo.remove.mockResolvedValue(org as any);

			const result = await service.remove('org-1', 'user-123');

			expect(service.findOne).toHaveBeenCalledWith('org-1', 'user-123');
			expect(repo.remove).toHaveBeenCalledWith(org);
			expect(result).toEqual(org);
		});
	});
});
