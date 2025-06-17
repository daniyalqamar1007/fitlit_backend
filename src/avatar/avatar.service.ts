/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreateAvatarDto } from './dto/create-avatar.dto';
import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';
import { Model, Types } from 'mongoose';
import { Avatar, AvatarDocument } from './schemas/avatar.schema';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import * as sharp from 'sharp';
import { AwsService } from 'src/aws/aws.service';
import {
  WardrobeItem,
  WardrobeItemDocument,
} from 'src/wardrobe/schemas/wardrobe.schema';

type InputType = 'Path' | 'Buffer';

interface UserSwipeState {
  swipeIndex: number;
  previous: { avatar: string }[];
  next: { avatar: string }[];
}

@Injectable()
export class AvatarService {
  private readonly apiKey = 'vur1J4WkuezAiJUJJB78bs8R'; // Your Remove.bg API Key
  // private swipeIndex = 0;
  // private previous = [];
  // private next = [];
  private userSwipeStates = new Map<string, UserSwipeState>();

  private readonly logger = new Logger(AvatarService.name);
  private readonly openai: OpenAI;

  constructor(
    @InjectModel(Avatar.name)
    private readonly avatarModel: Model<AvatarDocument>,

    @InjectModel(WardrobeItem.name)
    private readonly wardropeModel: Model<WardrobeItemDocument>,

    private readonly awsS3Service: AwsService,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    if (!process.env.OPENAI_API_KEY) {
      this.logger.warn(
        'OPENAI_API_KEY is not set! OpenAI service will not work properly.',
      );
    }
  }
  async saveavatar(dto: CreateAvatarDto, userId: string) {
  try {
    console.log("haseeb")
    console.log(dto.shirt_id)
       console.log(dto.accessories_id)
          console.log(dto.pant_id)
          console.log(dto.
            shoe_id
          )
          
  const created = new this.avatarModel({
  user_id: userId,
  shirt_id: new Types.ObjectId(dto.shirt_id),
  pant_id: new Types.ObjectId(dto.pant_id),
  shoe_id: new Types.ObjectId(dto.shoe_id),
  backgroundimageurl:dto.backgroundimageurl,
  accessories_id: new Types.ObjectId(dto.accessories_id),
  stored_message: dto.stored_message, // ✅ Fixed
  avatarUrl: dto.avatarUrl,
  date: dto.date,
});;
    console.log(created)

    await created.save();

    return {
      success: true,
      message: 'Avatar saved successfully',
    };
  } catch (error) {
    console.log("yes")
    throw new Error(`Failed to save avatar: ${error.message}`);
  }
}

  

  async checkAvailability(id:string , date: string) {
    console.log(date)
    console.log(id)
    const avatar = await this.avatarModel.findOne({ user_id:id, date });
    console.log(avatar)

    if (avatar) {
      return {
        success: true,
        avatarUrl: avatar.avatarUrl,
        backgroundimageurl: avatar.backgroundimageurl,
      };
    } else {
      return {
        success: false,
        message: 'Not saved yet',
        index: 1,
      };
    }
  }

  async getAvatarsByDate(userId: string) {
    try {
      const avatars = await this.avatarModel
        .find({
          user_id: userId,
          date: { $exists: true, $ne: null }, // ✅ Only avatars with date
        })
        .select('avatarUrl date stored_message backgroundimageurl') // stored_message might be null or missing — that's OK
        .sort({ date: -1 })
        .lean();

      return {
        success: true,
        data: avatars.map((avatar) => ({
          date: avatar.date,
          avatarUrl: avatar.avatarUrl,
          stored_message: avatar.stored_message ?? '',
          backgroundimageurl: avatar.backgroundimageurl,
           // 👈 fallback to empty string if it's null
        })),
      };
    } catch (error) {
      throw new Error(`Error fetching avatars by date: ${error.message}`);
    }
  }

  async removeBackground(
    input: string | Buffer,
    type: InputType,
  ): Promise<Buffer> {
    let base64Image: string;

    if (type === 'Path') {
      base64Image = fs.readFileSync(input as string, { encoding: 'base64' });
    } else if (type === 'Buffer') {
      base64Image = (input as Buffer).toString('base64');
    } else {
      throw new Error(`Unsupported input type: ${type}`);
    }

    const body = {
      image_file_b64: base64Image,
      size: 'auto',
    };

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Remove.bg API failed: ${response.status} - ${errorText}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async convertToPng(filePath: string): Promise<string | null> {
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const isPng = ext === '.png';

    if (isPng) {
      console.log('File is already a PNG.');
      return filePath;
    }

    console.log('File is not a PNG.');

    const baseName = path
      .basename(filePath)
      .replace(/\.(png|jpe?g|webp|bmp|gif|tiff?)+$/i, '');

    const outputPath = path.join(dir, `${baseName}.png`);

    try {
      await sharp(filePath).png().toFile(outputPath);
      console.log(`Converted to PNG: ${outputPath}`);
      fs.unlinkSync(filePath);
      console.log(`Deleted original file: ${filePath}`);
      return outputPath;
    } catch (err) {
      console.error('Conversion failed:', err);
      return null;
    }
  }

  async getSignupAvatar(filePath: string, prompt?: string) {
    try {
      // const newPath = await this.convertToPng(filePath);
      // if (!newPath) {
      //   throw new Error('Failed to convert image to PNG.');
      // }
      // return true;

      // Read the file as a buffer
      const imageBuffer = fs.readFileSync(filePath);
      // Create a File-like object
      const fileName = filePath.split('/').pop() ?? 'image.png';
      const imageFile = new FileLike(imageBuffer, fileName, 'image/png');
      console.log("now coming")
      // Send the image to OpenAI for editing
      console.log("going to gpt")
      const rsp = await this.openai.images.edit({
        model: 'gpt-image-1',
        image: imageFile,
        size: '1024x1536',
        background: 'transparent',
        quality: 'low',
        prompt:
          prompt ||
          `Transform this person into a full-body 3D digital avatar.
Ensure clean lines, realistic proportions, soft shading, and expressive yet simple features.
Maintain a balanced, stylized appearance suitable for virtual environments.
Remove the background completely to make it transparent.
Output the image in PNG format with a transparent background.`,
      });
      console.log(rsp)
      if (rsp.data) {
        const image_base64: any = rsp.data[0].b64_json;
        return Buffer.from(image_base64, 'base64');
      }

      console.log('Image generated successfully');
      return true;
    } catch (error) {
      console.error('Error during image processing:', error.message);
      return false;
    }
  }

  generateAvatarPrompt(category?: string): string {
    const clothingMap: Record<string, string> = {
      tshirt: 'a modern, fitted shirt with clean design and subtle detail',
      accessories:'minimalist yet stylish accessories with clean lines and subtle metallic highlights',
      pant: 'well-fitted casual pants in a neutral tone with realistic folds',
      shoe: 'stylish, casual shoes with a modern silhouette and soft shadows',
    };

    const clothingDescription =
      clothingMap[category!.toLowerCase()] || 'casual clothing';

    return `Transform this person into a full-body 3D digital avatar wearing ${clothingDescription}. 
Ensure clean lines, realistic proportions, soft shading, and expressive but simple features. 
Maintain a balanced, stylized appearance suitable for virtual environments.`;
  }

  async getUpdated3DAvatar(source: string, category: string, prompt?: string) {
    try {
      
      let imageBuffer: Buffer;
      let fileName = 'image.png';

      if (source.startsWith('http')) {
        // Download the image from the URL
        const response: any = await axios.get(source, {
          responseType: 'arraybuffer',
        });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        imageBuffer = Buffer.from(response.data, 'binary');

        // Try extracting the filename from the URL
        const urlParts = source.split('/');
        fileName = urlParts[urlParts.length - 1] || 'image.png';
      } else {
        // Load image from local file path
        imageBuffer = fs.readFileSync(source);
        fileName = source.split('/').pop() ?? 'image.png';
      }

      // Create a File-like object
      const imageFile = new FileLike(imageBuffer, fileName, 'image/png');
console.log("going to gpt")
      // Send image for editing
      const rsp = await this.openai.images.edit({
        model: 'gpt-image-1',
        image: imageFile,
        background: 'transparent',
        size: '1024x1536',
        quality: 'low',
        prompt: prompt || this.generateAvatarPrompt(category),
      });
      console.log(rsp)

      if (rsp.data && rsp.data[0].b64_json) {
        const image_base64: string = rsp.data[0].b64_json;
        return Buffer.from(image_base64, 'base64');
      }

      console.log('Image processed successfully');
      return true;
    } catch (error: any) {
      console.error('Error during image processing:', error.message);
      return false;
    }
  }

  async generateUpdatedAvatar(
    source1: string,
    source2: string,
    category: string,
  ) {
    try {
      // Download and read the original image
      const resp: any = await axios.get(source1, {
        responseType: 'arraybuffer',
      });
      const imageBuffer1 = Buffer.from(resp.data, 'binary');
      const fileName1 = source1.split('/').pop() || 'image.png';

      // Get the dimensions of the original image
      const imageMetadata = await sharp(imageBuffer1).metadata();
      const width = imageMetadata.width;
      const height = imageMetadata.height;

      // Process the mask to match the original image's size and ensure it has alpha
      const processedMaskBuffer = await sharp(source2)
        .resize(width, height) // resize to match
        .ensureAlpha() // ensure alpha channel
        .toBuffer();
      const fileName2 = source2.split('/').pop() || 'mask.png';

      // Create FileLike objects for OpenAI API
      const imageFile1 = new FileLike(imageBuffer1, fileName1, 'image/png');
      const imageFile2 = new FileLike(
        processedMaskBuffer,
        fileName2,
        'image/png',
      );

      // Send images for editing
      const response = await this.openai.images.edit({
        model: 'gpt-image-1',
        image: imageFile1,
        mask: imageFile2,
        size: '1024x1536', // optional: may be inferred or adjusted
        background: 'transparent',
        quality: 'low',
        // prompt: `Create a new full body avatar identical to the original image, keeping the outfit the same, but replace only the t-shirt using the mask image provided. Use the masked t-shirt design in place of the current one, and maintain the avatar's original style and appearance.`,
        prompt: `Transform this person into a full-body 3D digital avatar.
Ensure clean lines, realistic proportions, soft shading, and expressive yet simple features.
Maintain a balanced, stylized appearance suitable for virtual environments.
Remove the background completely to make it transparent.
Output the image in PNG format with a transparent background. 
important Note: i atached tshirt design in mask put that tshirt on the avatar`,
      });

      if (response.data?.[0]?.b64_json) {
        return Buffer.from(response.data[0].b64_json, 'base64');
      }

      return false;
    } catch (error) {
      console.error('Error generating updated avatar:', error.message);
      return false;
    }
  }

  async generateOutfit(source1: string,source5:string, source2: string, source3: string, source4: string) {
    try {
      console.log("new user")
      // const [response1, response2, response3] = await Promise.all([
      const response1: any = await axios.get(source1, {
        responseType: 'arraybuffer',
      });

      const response2: any = await axios.get(source2, {
        responseType: 'arraybuffer',
      });

      const response3: any = await axios.get(source3, {
        responseType: 'arraybuffer',
      });
       const response4: any = await axios.get(source4, {
        responseType: 'arraybuffer',
      });
         const response5: any = await axios.get(source5, {
        responseType: 'arraybuffer',
      });
      // ]);

      const imageBuffer1 = Buffer.from(response1.data, 'binary');
      const fileName1 = source1.split('/').pop() || 'image1.png';

      const imageBuffer2 = Buffer.from(response2.data, 'binary');
      const fileName2 = source2.split('/').pop() || 'image2.png';

      const imageBuffer3 = Buffer.from(response3.data, 'binary');
      const fileName3 = source3.split('/').pop() || 'image3.png';
    const imageBuffer4 = Buffer.from(response4.data, 'binary');
      const fileName4 = source4.split('/').pop() || 'image4.png';
          const imageBuffer5 = Buffer.from(response5.data, 'binary');
      const fileName5 = source5.split('/').pop() || 'image4.png';
      // Create FileLike objects for OpenAI API
      console.log("just fetch teh")
      const imageFile1 = new FileLike(imageBuffer1, fileName1, 'image/png');
      const imageFile2 = new FileLike(imageBuffer2, fileName2, 'image/png');
      const imageFile3 = new FileLike(imageBuffer3, fileName3, 'image/png');
     const imageFile4 = new FileLike(imageBuffer4, fileName4, 'image/png');
      const imageFile5 = new FileLike(imageBuffer5, fileName5, 'image/png');
      
      // Send images for editing
      console.log(imageFile4)
        console.log("generatuing")
       
 const response = await this.openai.images.edit({
        model: 'gpt-image-1',
        image: [imageFile1,imageFile5, imageFile2, imageFile3, imageFile4],
        size: '1024x1536', // optional: may be inferred or adjusted
        background: 'transparent',
        quality: 'low',
        prompt: `Transform the same person from image 4 into a full-body 3D digital avatar.
        Use face from image 5, dress with clothing from images 1-4 (shirt,accessories, pants, shoes),
        Ensure to fit the accessroies in that its place if it hat or air pods and bracclet and detect itself and put in its excat polace y 
Ensure clean lines, realistic proportions, soft shading, and expressive yet simple features.
Maintain a balanced, stylized appearance suitable for virtual environments.
Remove the background completely to make it transparent.
Output the image in PNG format with a transparent background.
Important: Make sure to change the clothes of same person. Dont change face or any other physical appearance`,
      });
      console.log(response)

      if (response.data?.[0]?.b64_json) {
        return Buffer.from(response.data[0].b64_json, 'base64');
      }

      return false;
    } catch (error) {
      console.error('Error generating updated avatar:', error.message);
      return false;
    }
  }

  // Background processing function
  private async processAvatarInBackground(
    dto: {
      shirt_id: string;
      accessories_id:string;
      pant_id: string;
      shoe_id: string;
      
      profile_picture: string;
    },
    userId: string,
  ) {
    try {
      const { shirt_id,accessories_id, pant_id, shoe_id } = dto;
      
      const source1 = await this.wardropeModel
        .findOne({ _id: shirt_id })
        .select('image_url');
         const source5 = await this.wardropeModel
        .findOne({ _id: accessories_id })
        .select('image_url');
      const source2 = await this.wardropeModel
        .findOne({ _id: pant_id })
        .select('image_url');
      const source3 = await this.wardropeModel
        .findOne({ _id: shoe_id })
        .select('image_url');
        
      console.log("now starting background generation")
      
      const generateOutfitBuffer = await this.generateOutfit(
        source1!.image_url,
         source5!.image_url,
        source2!.image_url,
        source3!.image_url,
         
        dto.profile_picture
      );
      
      console.log(generateOutfitBuffer);
      
      if (typeof generateOutfitBuffer !== 'boolean') {
        const generateOutfitUrl = await this.awsS3Service.uploadFile(
          generateOutfitBuffer,
          userId,
        );
        
        console.log(generateOutfitUrl);
        
        const created = new this.avatarModel({
          user_id: userId,
          avatarUrl: generateOutfitUrl,
          shirt_id: shirt_id,
          accessories_id:accessories_id,
          pant_id: pant_id,
          shoe_id: shoe_id,
        });
        
        await created.save();
        console.log("Avatar generated and saved in background");
      }
    } catch (error) {
      console.error('Background processing error:', error);
    }
  }

  async outfit(
    dto: {
      shirt_id: string;
      accessories_id:string;
      pant_id: string;
      shoe_id: string;
      profile_picture: string;
    },
    userId: string,
  ) {
    try {
      const { shirt_id,accessories_id, pant_id, shoe_id } = dto;
      
      // Check if avatar already exists
      const avatar = await this.avatarModel.findOne({
        user_id: userId,
        shirt_id,
        accessories_id,
        pant_id,
        shoe_id,
      });
      
      if (avatar !== null) {
        return {
          success: true,
          avatar: avatar.avatarUrl,
        };
      }
      
      // If avatar doesn't exist, return success immediately
      // and start background processing
      console.log("Starting background avatar generation")
      
      // Process in background (don't await)
      this.processAvatarInBackground(dto, userId);
      
      return {
        success: true,
        message: 'Avatar generation started',
        status: 'processing'
      };
      
    } catch (error) {
      console.log(error);
      return {
        success: false,
        message: 'Failed to process avatar request',
        status: 'error'
      };
    }
  }

  // async swipe(userId: string, dto: any) {
  //   try {
  //     if (dto.swipeAngle === 'left') {
  //       // Undo - show previous swipe
  //       if (this.swipeIndex === 0)
  //         // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  //         return { success: true, avatar: dto.avatarUrl };

  //       this.swipeIndex--;
  //       const avatar = this.previous[this.swipeIndex];
  //       this.previous.shift();
  //       return {
  //         success: true,
  //         avatar: avatar,
  //       };
  //     }

  //     if (dto.swipeAngle === 'right') {
  //       // First-time or next swipe - fetch new item
  //       const wardrobeItems = await this.wardropeModel
  //         .find({ user_id: userId })
  //         .sort({ createdAt: -1 })
  //         .skip(this.swipeIndex)
  //         .limit(1);

  //       if (wardrobeItems.length == 0)
  //         // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  //         return { success: true, avatar: dto.avatarUrl };

  //       const item = wardrobeItems[0];
  //       this.swipeIndex++;
  //       this.next.push({ _id: item._id, avatar: item.avatar_url });

  //       return { avatar: item.avatar_url };
  //     }
  //   } catch (e) {
  //     throw new BadRequestException(e.message);
  //   }
  // }
  async getAllUserAvatars(userId: string) {
  try {
    const avatars = await this.avatarModel
      .find({ user_id: userId })
      .select('avatarUrl')
      .sort({ createdAt: -1 }); // Sort by newest first

    const avatarUrls = avatars.map(avatar => avatar.avatarUrl);
console.log(avatarUrls.length)
    return {
      success: true,
      avatars: avatarUrls,
      count: avatarUrls.length
    };
  } catch (error) {
    throw new Error(`Failed to fetch user avatars: ${error.message}`);
  }
}

}

// FileLike class moved outside of AvatarService
class FileLike extends Blob {
  lastModified: number;
  name: string;
  constructor(buffer: Buffer, name: string, type: string) {
    super([buffer], { type });
    this.lastModified = Date.now();
    this.name = name;
  }
}
