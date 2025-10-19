import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './users/entities/user.entity';
import { AuthModule } from './auth/auth.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { Organization } from './organizations/entities/organization.entity';

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
				database: config.get<string>('DB_NAME'),
				synchronize: config.get<boolean>('SYNCHRONIZE'),
				entities: [User, Organization],
			}),
		}),
		UsersModule,
		AuthModule,
		OrganizationsModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
