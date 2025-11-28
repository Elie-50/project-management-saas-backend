import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.enableCors({
		origin: [process.env.ORIGIN!, 'http://localhost', 'http://localhost:80'],
		methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
		credentials: true,
	});

	await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}

bootstrap().catch((err) => {
	console.error('Error during app bootstrap:', err);
	process.exit(1);
});
