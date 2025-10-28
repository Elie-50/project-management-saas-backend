import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { ILike, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
	let service: UsersService;
	let usersRepository: jest.Mocked<Repository<User>>;

	beforeEach(async () => {
		const mockRepository = {
			save: jest.fn(),
			findOne: jest.fn(),
			update: jest.fn(),
			remove: jest.fn(),
			findAndCount: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UsersService,
				{
					provide: getRepositoryToken(User),
					useValue: mockRepository,
				},
			],
		}).compile();

		service = module.get<UsersService>(UsersService);
		usersRepository = module.get(getRepositoryToken(User));
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('create', () => {
		it('should save and return the user', async () => {
			const createUserDto = {
				email: 'new@example.com',
				password: 'newpass123',
				username: 'user',
				firstName: 'First',
				lastName: 'Last',
			};
			const savedUser = {
				id: '1',
				createdAt: new Date(),
				updatedAt: new Date(),
				...createUserDto,
			};

			usersRepository.save.mockResolvedValue(savedUser);

			const result = await service.create(createUserDto);

			expect(usersRepository.save).toHaveBeenCalledWith(createUserDto);
			expect(result).toEqual(savedUser);
		});
	});

	describe('findOne', () => {
		it('should find a user by email', async () => {
			const user = { id: '1', email: 'test@example.com' } as User;

			usersRepository.findOne.mockResolvedValue(user);

			const result = await service.findOne('test@example.com');

			expect(usersRepository.findOne).toHaveBeenCalledWith({
				where: { email: 'test@example.com' },
			});
			expect(result).toEqual(user);
		});
	});

	describe('findById', () => {
		it('should find a user by id', async () => {
			const user = { id: '1', email: 'test@example.com' } as User;

			usersRepository.findOne.mockResolvedValue(user);

			const result = await service.findById('1');

			expect(usersRepository.findOne).toHaveBeenCalledWith({
				where: { id: '1' },
				select: [
					'id',
					'username',
					'lastName',
					'firstName',
					'email',
					'createdAt',
				],
			});
			expect(result).toEqual(user);
		});
	});

	describe('update', () => {
		it('should update the user', async () => {
			const updateUserDto = { firstName: 'Updated' };

			const updateResult: User = {
				id: 'id-user',
				...updateUserDto,
			} as User;

			jest.spyOn(service, 'findById').mockResolvedValue(updateResult as any);

			const result = await service.update('1', updateUserDto);

			expect(usersRepository.update).toHaveBeenCalledWith('1', updateUserDto);
			expect(result).toEqual(updateResult);
		});
	});

	describe('remove', () => {
		it('should remove existing user', async () => {
			const user = { id: '1', email: 'test@example.com' } as User;

			usersRepository.findOne.mockResolvedValue(user);
			usersRepository.remove.mockResolvedValue(user);

			const result = await service.remove('1');

			expect(usersRepository.findOne).toHaveBeenCalledWith({
				where: { id: '1' },
			});
			expect(usersRepository.remove).toHaveBeenCalledWith(user);
			expect(result).toEqual(user);
		});

		it('should throw NotFoundException if user does not exist', async () => {
			usersRepository.findOne.mockResolvedValue(null);

			await expect(service.remove('1')).rejects.toThrow(NotFoundException);
			expect(usersRepository.findOne).toHaveBeenCalledWith({
				where: { id: '1' },
			});
			expect(usersRepository.remove).not.toHaveBeenCalled();
		});
	});

	describe('search', () => {
		it('should find users', async () => {
			const users = [
				{ id: '1', email: 'test@example.com' },
				{ id: '2', email: 'email@example.com' },
			] as User[];

			const total = 2;
			const page = 1;
			const pageCount = 1;

			const response = {
				data: users,
				total,
				page,
				pageCount,
			};

			usersRepository.findAndCount.mockResolvedValue([users, total]);

			const name = 'name';
			const result = await service.searchUsersByName(name);

			const args = {
				where: [
					{ firstName: ILike(`%${name}%`) },
					{ lastName: ILike(`%${name}%`) },
					{ username: ILike(`%${name}%`) },
				],
				select: [
					'id',
					'firstName',
					'lastName',
					'username',
					'email',
					'createdAt',
				],
				take: 20,
				skip: 0,
			};

			expect(usersRepository.findAndCount).toHaveBeenCalledWith(args);
			expect(result).toEqual(response);
		});
	});
});
