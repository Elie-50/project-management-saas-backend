import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UpdateResult } from 'typeorm';
import { JwtService } from '@nestjs/jwt';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

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

  beforeEach(async () => {
    const mockUsersService = {
      findById: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
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

      const updateResult: UpdateResult = {
        affected: 1,
        raw: [],
        generatedMaps: [],
      };

      usersService.update.mockResolvedValueOnce(updateResult);

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
});
