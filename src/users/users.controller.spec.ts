import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { MembershipsService } from '../memberships/memberships.service';
import { Organization } from '../organizations/entities/organization.entity';
import { Membership } from '../memberships/entities/membership.entity';

describe('UsersController', () => {
	let controller: UsersController;
	let usersService: jest.Mocked<UsersService>;
	let membershipsService: jest.Mocked<MembershipsService>;

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

	const mockRequest = {
		user: { id: mockUser.id },
	} as any;

	const mockUsersService = {
		findById: jest.fn(),
		update: jest.fn(),
		remove: jest.fn(),
		findAllMemberships: jest.fn(),
	};

	const mockMembershipService = {
		findAllMemberships: jest.fn(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [UsersController],
			providers: [
				{
					provide: UsersService,
					useValue: mockUsersService,
				},
				{
					provide: MembershipsService,
					useValue: mockMembershipService,
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

		controller = module.get<UsersController>(UsersController);
		usersService = module.get(UsersService);
		membershipsService = module.get(MembershipsService);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	describe('findOne', () => {
		it('should return the current user', async () => {
			usersService.findById.mockResolvedValueOnce(mockUser);

			const result = await controller.findOne(mockRequest);

			expect(usersService.findById).toHaveBeenCalledWith(mockUser.id);
			expect(result).toEqual(mockUser);
		});
	});

	describe('update', () => {
		it('should update the current user', async () => {
			const updateDto: UpdateUserDto = { firstName: 'Updated' };

			const updateResult = {
				id: 'id-123',
				...updateDto,
			};

			usersService.update.mockResolvedValueOnce(updateResult as any);

			const result = await controller.update(mockRequest, updateDto);

			expect(usersService.update).toHaveBeenCalledWith(mockUser.id, updateDto);
			expect(result).toEqual(updateResult);
		});
	});

	describe('remove', () => {
		it('should remove the current user', async () => {
			usersService.remove.mockResolvedValueOnce(mockUser);

			const result = await controller.remove(mockRequest);

			expect(usersService.remove).toHaveBeenCalledWith(mockUser.id);
			expect(result).toEqual(mockUser);
		});
	});

	describe('findMemberships', () => {
		it('should call service find memberships', async () => {
			const memberships = [
				{
					id: 'id-123',
					organization: {
						id: 'org-123',
					} as Organization,
				},
			] as Membership[];
			membershipsService.findAllMemberships.mockResolvedValueOnce(memberships);

			const result = await controller.findMemberships(mockRequest);

			expect(membershipsService.findAllMemberships).toHaveBeenCalledWith(
				mockUser.id,
			);
			expect(result).toEqual(memberships);
		});
	});
});
