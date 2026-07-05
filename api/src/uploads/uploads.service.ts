import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import { extname } from 'path';

// File ảnh nhận từ multer (memory storage) — chỉ khai các trường ta dùng,
// để không phải phụ thuộc @types/multer.
export interface UploadedImageFile {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
  size: number;
}

@Injectable()
export class UploadsService implements OnModuleInit {
  private readonly s3: S3Client;
  private readonly bucket = process.env.MINIO_BUCKET ?? 'ketnoi-media';
  private readonly publicUrl =
    process.env.MINIO_PUBLIC_URL ?? 'http://localhost:9000';

  constructor() {
    this.s3 = new S3Client({
      endpoint: process.env.MINIO_ENDPOINT ?? 'http://localhost:9000',
      region: process.env.MINIO_REGION ?? 'us-east-1',
      forcePathStyle: true, // BẮT BUỘC cho MinIO (không dùng virtual-host style)
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY ?? 'ketnoi',
        secretAccessKey: process.env.MINIO_SECRET_KEY ?? 'ketnoi_dev_2026',
      },
    });
  }

  // Đảm bảo bucket tồn tại; nếu MinIO chưa chạy thì bỏ qua (sẽ lỗi rõ khi upload)
  async onModuleInit() {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        await this.s3.send(new CreateBucketCommand({ Bucket: this.bucket }));
        console.log(`🪣  Đã tạo bucket "${this.bucket}"`);
      } catch (e) {
        console.warn(
          `⚠️  Chưa đảm bảo được bucket "${this.bucket}" (MinIO đã chạy chưa?):`,
          (e as Error).message,
        );
      }
    }
  }

  // Tải 1 ảnh lên MinIO, trả về URL công khai
  async uploadImage(file: UploadedImageFile) {
    const ext = extname(file.originalname) || '.jpg';
    const today = new Date().toISOString().slice(0, 10);
    const key = `products/${today}/${randomUUID()}${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return {
      url: `${this.publicUrl}/${this.bucket}/${key}`,
      key,
      size: file.size,
    };
  }
}
