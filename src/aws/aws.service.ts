import { HttpStatus, Injectable } from '@nestjs/common';
import { ResponseDto } from './dto/response.dto';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import {
  S3Client,
  DeleteObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as Multer from 'multer';
import * as sharp from 'sharp';
import * as path from 'path';

@Injectable()
export class AwsService {
  private s3: S3Client;
  private bucketName: string;
  constructor(private configService: ConfigService) {
    this.s3 = new S3Client({
      region: process.env.AWS_BUCKET_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY!,
        secretAccessKey: process.env.AWS_SECRET_KEY!,
      },
    });
    this.bucketName = process.env.S3_BUCKET_NAME!;
  }

  async uploadFile(buffer: Buffer, file?: Multer.File): Promise<string> {
    const originalName = file?.originalname || 'image.png';
    const fileExt = path.extname(originalName).toLowerCase();
    const fileKey = `wardrobe/${Date.now()}-${originalName}`;
    let compressedBuffer: Buffer;
    let contentType = file?.mimetype || 'image/png';

    if (fileExt === '.png') {
      compressedBuffer = await sharp(buffer)
        .png({ quality: 80, compressionLevel: 9 }) // Keeps transparency
        .toBuffer();
    } else if (fileExt === '.webp') {
      compressedBuffer = await sharp(buffer).webp({ quality: 80 }).toBuffer();
      contentType = 'image/webp';
    } else {
      // Default: convert to JPEG (no transparency)
      compressedBuffer = await sharp(buffer).jpeg({ quality: 70 }).toBuffer();
      contentType = 'image/jpeg';
    }

    if (compressedBuffer.length > 500 * 1024) {
      throw new Error('Image too large even after compression');
    }

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
      Body: compressedBuffer,
      ContentType: contentType,
    });

    await this.s3.send(command);

    return `https://${this.bucketName}.s3.${this.configService.get<string>('AWS_BUCKET_REGION')}.amazonaws.com/${fileKey}`;
  }

  async uploadFileDress(file: Multer.File, userId: string): Promise<string> {
    const fileExt = path.extname(file.originalname).toLowerCase();
    const fileKey = `wardrobe/${userId}/${Date.now()}-${file.originalname}`;

    let compressedBuffer: Buffer;
    let contentType = file.mimetype;

    if (fileExt === '.png') {
      compressedBuffer = await sharp(file.buffer)
        .png({ quality: 80, compressionLevel: 9 }) // Preserves transparency
        .toBuffer();
    } else if (fileExt === '.webp') {
      compressedBuffer = await sharp(file.buffer)
        .webp({ quality: 80 })
        .toBuffer();
      contentType = 'image/webp';
    } else {
      // Default to JPEG for other types, with fallback (lossy, no transparency)
      compressedBuffer = await sharp(file.buffer)
        .jpeg({ quality: 70 })
        .toBuffer();
      contentType = 'image/jpeg';
    }

    // Optional: ensure file is under 500KB
    if (compressedBuffer.length > 500 * 1024) {
      throw new Error('Compressed image exceeds 500KB');
    }

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
      Body: compressedBuffer,
      ContentType: contentType,
    });

    await this.s3.send(command);

    return `https://${this.bucketName}.s3.${this.configService.get<string>('AWS_BUCKET_REGION')}.amazonaws.com/${fileKey}`;
  }

  async generateSignedUrl(
    fileName: string,
    contentType: string,
    timeStamp?: string,
  ) {
    try {
      if (timeStamp) {
        const key = fileName;
        // console.log(key)
        // Create a PutObjectCommand with the correct parameters
        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          ContentType: contentType,
        });
        // Generate the signed URL
        const url = await getSignedUrl(this.s3, command, { expiresIn: 60 * 5 }); // URL expires in 5 minutes
        return {
          success: false,
          statusCode: HttpStatus.OK,
          msg: {
            url,
            key,
          },
        };
      } else {
        const key = `${Date.now()}-${fileName}`;
        // Create a PutObjectCommand with the correct parameters
        const command = new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          ContentType: contentType,
        });
        // Generate the signed URL
        const url = await getSignedUrl(this.s3, command, { expiresIn: 60 * 5 }); // URL expires in 5 minutes
        return {
          success: false,
          statusCode: HttpStatus.OK,
          msg: {
            url,
            key,
          },
        };
      }
    } catch (e) {
      return { success: false, statusCode: HttpStatus.INTERNAL_SERVER_ERROR };
    }
  }
  async deleteFile(key: string): Promise<ResponseDto> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      await this.s3.send(command);
      return {
        success: true,
        statusCode: HttpStatus.OK,
        msg: `File ${key} deleted successfully`,
      };
    } catch (error) {
      console.log(`Failed to delete file: ${error.message}`);
      return {
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        msg: error.message,
      };
    }
  }
}
