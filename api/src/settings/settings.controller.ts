import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../admin/admin.guard';
import { SettingsService } from './settings.service';
import { UpsertSettingDto } from './dto/upsert-setting.dto';

@Controller('settings')
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

  @Get() // GET /settings → { hotline_hcm: "...", nguong_freeship: "2000000", ... }
  findAll() {
    return this.service.findAllAsMap();
  }

  @Get(':key') // GET /settings/hotline_hcm
  findOne(@Param('key') key: string) {
    return this.service.findOne(key);
  }

  @Put(':key') // PUT /settings/hotline_hcm  body: { "value": "0900 111 222" }
  @UseGuards(AdminGuard)
  upsert(@Param('key') key: string, @Body() dto: UpsertSettingDto) {
    return this.service.upsert(key, dto.value);
  }

  @Delete(':key') // DELETE /settings/<key>
  @UseGuards(AdminGuard)
  remove(@Param('key') key: string) {
    return this.service.remove(key);
  }
}
