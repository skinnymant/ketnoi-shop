import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import type { UploadedImageFile } from './uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly service: UploadsService) {}

  // POST /uploads/image  (multipart/form-data, field name: "file")
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // tối đa 5MB
    }),
  )
  async uploadImage(@UploadedFile() file: UploadedImageFile) {
    if (!file) {
      throw new BadRequestException(
        'Chưa nhận được file — field name phải là "file"',
      );
    }
    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Chỉ chấp nhận file ảnh (image/*)');
    }
    return this.service.uploadImage(file);
  }
}
