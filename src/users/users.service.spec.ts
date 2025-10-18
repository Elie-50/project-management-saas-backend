import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { UpdateResult } from 'typeorm';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const mockRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
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
      const savedUser = { id: '1', createdAt: new Date(), updatedAt: new Date(), ...createUserDto };

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

      expect(usersRepository.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(result).toEqual(user);
    });
  });

  describe('findById', () => {
    it('should find a user by id', async () => {
      const user = { id: '1', email: 'test@example.com' } as User;

      usersRepository.findOne.mockResolvedValue(user);

      const result = await service.findById('1');

      expect(usersRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(result).toEqual(user);
    });
  });

  describe('update', () => {
    it('should update the user', async () => {
      const updateUserDto = { firstName: 'Updated' };

      const updateResult: UpdateResult = {
        affected: 1,
        raw: [],
        generatedMaps: [],
      };

      usersRepository.update.mockResolvedValue(updateResult);

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

      expect(usersRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(usersRepository.remove).toHaveBeenCalledWith(user);
      expect(result).toEqual(user);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('1')).rejects.toThrow(NotFoundException);
      expect(usersRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(usersRepository.remove).not.toHaveBeenCalled();
    });
  });
});
