import { Module } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { AdminGuard } from '../admin/admin.guard';

@Module({
  controllers: [SettingsController],
  providers: [SettingsService, AdminGuard],
})
export class SettingsModule {}
