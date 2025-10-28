import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { ILike, Repository } from 'typeorm';

type SafeUserResponse = Omit<User, 'password'>;

@Injectable()
export class UsersService {
	constructor(
		@InjectRepository(User)
		private readonly usersRepository: Repository<User>,
	) {}

	create(createUserDto: CreateUserDto) {
		return this.usersRepository.save(createUserDto);
	}

	findOne(email: string) {
		return this.usersRepository.findOne({ where: { email } });
	}

	async findById(id: string): Promise<SafeUserResponse> {
		const user = await this.usersRepository.findOne({
			where: { id },
			select: ['id', 'username', 'lastName', 'firstName', 'email', 'createdAt'],
		});

		if (!user) {
			throw new NotFoundException('User Not Found');
		}

		return user;
	}

	async update(
		id: string,
		updateUserDto: UpdateUserDto,
	): Promise<SafeUserResponse> {
		await this.usersRepository.update(id, updateUserDto);

		return this.findById(id);
	}

	async remove(id: string) {
		const existing = await this.usersRepository.findOne({ where: { id } });

		if (!existing) {
			throw new NotFoundException('User not found');
		}

		return this.usersRepository.remove(existing);
	}

	async searchUsersByName(name: string, page: number = 1) {
		const take = 20;
		const skip = (page - 1) * take;
		const [users, total] = await this.usersRepository.findAndCount({
			where: [
				{ firstName: ILike(`%${name}%`) },
				{ lastName: ILike(`%${name}%`) },
				{ username: ILike(`%${name}%`) },
			],
			select: ['id', 'firstName', 'lastName', 'username', 'email', 'createdAt'],
			take,
			skip,
		});

		return {
			data: users,
			total,
			page,
			pageCount: Math.ceil(total / take),
		};
	}
}
