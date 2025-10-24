import { Test, TestingModule } from '@nestjs/testing';
import { MembershipsService } from './memberships.service';
import { Repository } from 'typeorm';
import { Membership } from './entities/membership.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { User } from '../users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { NotFoundException } from '@nestjs/common';

describe('MembershipsService', () => {
	let service: MembershipsService;
	let membershipRepo: jest.Mocked<Repository<Membership>>;
	let userRepo: jest.Mocked<Repository<User>>;
	let orgRepo: jest.Mocked<Repository<Organization>>;

	const mockRepo = () => ({
		findOneByOrFail: jest.fn(),
		create: jest.fn(),
		save: jest.fn(),
		delete: jest.fn(),
		createQueryBuilder: jest.fn(),
	});

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				MembershipsService,
				{ provide: getRepositoryToken(Membership), useValue: mockRepo() },
				{ provide: getRepositoryToken(User), useValue: mockRepo() },
				{ provide: getRepositoryToken(Organization), useValue: mockRepo() },
			],
		}).compile();

		service = module.get<MembershipsService>(MembershipsService);
		membershipRepo = module.get(getRepositoryToken(Membership));
		userRepo = module.get(getRepositoryToken(User));
		orgRepo = module.get(getRepositoryToken(Organization));
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('create', () => {
		it('should create and save a membership', async () => {
			const dto: CreateMembershipDto = {
				userId: 'user-1',
				organizationId: 'org-1',
			};
			const user = { id: 'user-1' } as User;
			const org = { id: 'org-1' } as Organization;
			const membership = { id: 'mem-1', user, organization: org } as Membership;

			userRepo.findOneByOrFail.mockResolvedValue(user);
			orgRepo.findOneByOrFail.mockResolvedValue(org);
			membershipRepo.create.mockReturnValue(membership);
			membershipRepo.save.mockResolvedValue(membership);

			const result = await service.create(dto);

			expect(userRepo.findOneByOrFail).toHaveBeenCalledWith({ id: dto.userId });
			expect(orgRepo.findOneByOrFail).toHaveBeenCalledWith({
				id: dto.organizationId,
			});
			expect(membershipRepo.create).toHaveBeenCalledWith({
				user,
				organization: org,
			});
			expect(membershipRepo.save).toHaveBeenCalledWith(membership);
			expect(result).toEqual(membership);
		});
	});

	describe('remove', () => {
		it('should delete the membership successfully', async () => {
			membershipRepo.delete.mockResolvedValue({ affected: 1 } as any);

			await expect(service.remove('org-1', 'user-1')).resolves.toBeUndefined();

			expect(membershipRepo.delete).toHaveBeenCalledWith({
				user: { id: 'user-1' },
				organization: { id: 'org-1' },
			});
		});

		it('should throw NotFoundException if membership not found', async () => {
			membershipRepo.delete.mockResolvedValue({ affected: 0 } as any);

			await expect(service.remove('org-1', 'user-1')).rejects.toThrow(
				NotFoundException,
			);
		});
	});

	describe('findAllMembers', () => {
		it('should return mapped members', async () => {
			const mockQB: any = {
				innerJoin: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis(),
				select: jest.fn().mockReturnThis(),
				orderBy: jest.fn().mockReturnThis(),
				getRawMany: jest.fn().mockResolvedValue([
					{
						id: 'user-1',
						username: 'Alice',
						email: 'alice@test.com',
						joinedAt: new Date(),
					},
				]),
			};

			membershipRepo.createQueryBuilder.mockReturnValue(mockQB);

			const result = await service.findAllMembers('org-1');

			expect(membershipRepo.createQueryBuilder).toHaveBeenCalledWith(
				'membership',
			);
			expect(result).toEqual([
				expect.objectContaining({
					id: 'user-1',
					username: 'Alice',
					email: 'alice@test.com',
				}),
			]);
		});
	});
});
