import { Module } from '@nestjs/common';
import { UsersModule } from '../src/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../src/users/entities/user.entity';
import { AuthModule } from '../src/auth/auth.module';
import { OrganizationsModule } from '../src/organizations/organizations.module';
import { Organization } from '../src/organizations/entities/organization.entity';
import { MembershipsModule } from '../src/memberships/memberships.module';
import { Membership } from '../src/memberships/entities/membership.entity';
import { Project } from '../src/projects/entities/project.entity';
import { ProjectsModule } from '../src/projects/projects.module';
import { Task } from '../src/tasks/entities/task.entity';
import { TasksModule } from '../src/tasks/tasks.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (config: ConfigService) => ({
				type: 'postgres',
				host: config.get<string>('DB_HOST'),
				port: config.get<number>('DB_PORT'),
				username: config.get<string>('DB_USER'),
				password: config.get<string>('DB_PASS'),
				database: config.get<string>('DB_NAME_TEST'),
				synchronize: true,
				dropSchema: true,
				entities: [User, Organization, Membership, Project, Task],
			}),
		}),
		UsersModule,
		AuthModule,
		OrganizationsModule,
		MembershipsModule,
		ProjectsModule,
		TasksModule,
	],
	controllers: [],
	providers: [],
})
export class AppTestModule {}
