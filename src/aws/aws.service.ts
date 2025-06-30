import { Injectable } from "@nestjs/common"
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { v4 as uuidv4 } from "uuid"

@Injectable()
export class AwsService {
  private s3Client: S3Client
  private bucketName: string

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_BUCKET_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
      },
    })
    this.bucketName = process.env.S3_BUCKET_NAME
  }

  async uploadFile(buffer: Buffer, file: any): Promise<string> {
    const key = `${uuidv4()}-${file.originalname}`

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: file.mimetype,
      ACL: "public-read",
    })

    await this.s3Client.send(command)

    return `https://${this.bucketName}.s3.${process.env.AWS_BUCKET_REGION}.amazonaws.com/${key}`
  }

  async uploadFileDress(file: any, userId: string): Promise<string> {
    const key = `wardrobe/${userId}/${uuidv4()}-${file.originalname}`

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: "public-read",
    })

    await this.s3Client.send(command)

    return `https://${this.bucketName}.s3.${process.env.AWS_BUCKET_REGION}.amazonaws.com/${key}`
  }

  async deleteFile(url: string): Promise<boolean> {
    try {
      const key = url.split("/").pop()

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })

      await this.s3Client.send(command)
      return true
    } catch (error) {
      console.error("Error deleting file:", error)
      return false
    }
  }
}
