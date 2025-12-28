import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { TypeOrmModule } from '@nestjs/typeorm';
import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';
import { Logger } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { User } from './users/entities/user.entity';
import { Role } from './roles/entities/role.entity';
import { ProjectsModule } from './projects/projects.module';
import { InstitutionsModule } from './institutions/institutions.module';
import { StudentGroupsModule } from './student-groups/student-groups.module';
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('CacheModule');
        const redisUrl = configService.get<string>('REDIS_URL');

        // If Redis URL is configured, use Redis; otherwise fallback to in-memory
        if (redisUrl) {
          try {
            const redisKeyv = new Keyv({
              store: new KeyvRedis(redisUrl),
              namespace: 'pd-projects',
              ttl: 5 * 60 * 1000,
            });

            // Add connection error handler
            redisKeyv.on('error', (err) => {
              logger.error(
                'Redis connection error, cache may not work properly:',
                err,
              );
            });

            logger.log('Using Redis cache');
            return {
              stores: [redisKeyv],
            };
          } catch (error) {
            logger.warn(
              'Failed to initialize Redis cache, falling back to in-memory cache:',
              error,
            );
          }
        }

        // Default to in-memory cache
        logger.log('Using in-memory cache');
        const memoryKeyv = new Keyv({
          namespace: 'pd-projects',
          ttl: 5 * 60 * 1000,
        });

        return {
          stores: [memoryKeyv],
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [User, Role],
      synchronize: true,
      autoLoadEntities: true,
    }),
    RolesModule,
    UsersModule,
    AuthModule,
    ProjectsModule,
    InstitutionsModule,
    StudentGroupsModule,
    SeedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
