import {
	IsEnum,
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUUID,
	MaxLength,
	IsDateString,
	Length,
} from 'class-validator';
import { TaskStatus } from '../entities/task.entity';

export class CreateTaskDto {
	@IsString()
	@IsNotEmpty()
	@MaxLength(50)
	name: string;

	@IsString()
	@IsNotEmpty()
	description: string;

	@IsUUID()
	@IsNotEmpty()
	projectId: string;

	@IsUUID()
	assigneeId: string;

	@IsEnum(TaskStatus)
	@IsOptional()
	status?: TaskStatus;

	@IsString()
	@Length(7, 7)
	@IsOptional()
	color?: string;

	@IsDateString()
	@IsNotEmpty()
	dueDate: string | Date;
}
