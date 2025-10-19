import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { User } from '../users/entities/user.entity';
import { UpdateResult } from 'typeorm';
import { JwtService } from '@nestjs/jwt';

describe('OrganizationsController', () => {
	let controller: OrganizationsController;
	let service: jest.Mocked<OrganizationsService>;

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

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [OrganizationsController],
			providers: [
				{
					provide: OrganizationsService,
					useValue: mockService,
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
			const expected: UpdateResult = {
				affected: 1,
				raw: [],
				generatedMaps: [],
			};

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
});
