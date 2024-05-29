import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { ExerciseModule } from './modules/exercise/exercise.module';
import { FollowerModule } from './modules/followers/follower.module';
import { GoalModule } from './modules/goals/goal.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { ProgressModule } from './modules/progress/progress.module';
import { RatingModule } from './modules/ratings/rating.module';
import { UserModule } from './modules/user/user.module';
import { WorkoutModule } from './modules/workout/workout.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    WorkoutModule,
    ExerciseModule,
    AuthModule,
    UserModule,
    ProgressModule,
    GoalModule,
    MetricsModule,
    RatingModule,
    FollowerModule,
  ],
  controllers: [AppController],
  providers:   [AppService],
})
export class AppModule {}
