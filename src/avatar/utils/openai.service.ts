import OpenAI from "openai"

export class OpenAIService {
  private openai: OpenAI

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  async generateImage(prompt: string): Promise<string> {
    try {
      const response = await this.openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
      })

      return response.data[0].url
    } catch (error) {
      console.error("OpenAI image generation failed:", error)
      throw error
    }
  }

  async editImage(imageUrl: string, prompt: string): Promise<string> {
    try {
      const response = await this.openai.images.edit({
        image: imageUrl as any,
        prompt: prompt,
        n: 1,
        size: "1024x1024",
      })

      return response.data[0].url
    } catch (error) {
      console.error("OpenAI image edit failed:", error)
      throw error
    }
  }
}
