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
  // async uploadFile(base64: any, file?: Multer.File): Promise<string> {
  //   const fileKey = `wardrobe/${Date.now()}-${file?.originalname || 'image.png'}`;

  //   // Remove the base64 header if it exists (optional safety step)
  //   const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');

  //   const buffer = Buffer.from(base64Data, 'base64'); // ✅ convert to binary buffer

  //   const command = new PutObjectCommand({
  //     Bucket: this.bucketName,
  //     Key: fileKey,
  //     Body: buffer, // ✅ use buffer, not base64 string
  //     ContentType: file?.mimetype || 'image/png',
  //     // ACL: 'public-read', // optional
  //   });

  //   await this.s3.send(command);

  //   return `https://${this.bucketName}.s3.${this.configService.get<string>('AWS_BUCKET_REGION')}.amazonaws.com/${fileKey}`;
  // }

  // async uploadFile(buffer: any, file?:  Multer.File ): Promise<string> {
  //   const fileKey = `wardrobe/${Date.now()}-${file.originalname}`;

  //   const command = new PutObjectCommand({
  //     Bucket: this.bucketName,
  //     Key: fileKey,
  //     Body: buffer,
  //     ContentType: file.mimetype,
  //     // ACL: 'public-read', // Make the file publicly accessible
  //   });

  //   await this.s3.send(command);

  //   // Generate the public URL
  //   return `https://${this.bucketName}.s3.${this.configService.get<string>('AWS_BUCKET_REGION')}.amazonaws.com/${fileKey}`;
  // }

  async uploadFile(buffer: Buffer, file?: Multer.File): Promise<string> {
    const fileKey = `wardrobe/${Date.now()}-${file?.originalname || 'image.png'}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
      Body: buffer, // Already a buffer — no conversion needed
      ContentType: file?.mimetype || 'image/png',
      // ACL: 'public-read', // optional
    });

    await this.s3.send(command);

    return `https://${this.bucketName}.s3.${this.configService.get<string>('AWS_BUCKET_REGION')}.amazonaws.com/${fileKey}`;
  }

  async uploadFileDress(file: Multer.File, userId: string): Promise<string> {
    const fileKey = `wardrobe/${userId}/${Date.now()}-${file.originalname}`;
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
      // ACL: 'public-read', // Make the file publicly accessible
    });
    await this.s3.send(command);
    // Generate the public URL
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
