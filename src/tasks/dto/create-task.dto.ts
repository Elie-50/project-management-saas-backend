import {
	IsEnum,
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUUID,
	MaxLength,
	IsDateString,
} from 'class-validator';
import { TaskStatus, TaskColor } from '../entities/task.entity';

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

	@IsEnum(TaskColor)
	@IsOptional()
	color?: TaskColor;

	@IsDateString()
	@IsNotEmpty()
	dueDate: string | Date;
}
