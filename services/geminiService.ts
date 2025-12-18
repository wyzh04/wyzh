
import { GoogleGenAI, Type } from "@google/genai";
import { PromptResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeMediaForPrompts(
  mediaList: {base64: string, mimeType: string}[], 
  fusionInstructions: string = ""
): Promise<PromptResult> {
  // Use gemini-3-pro-preview for complex reasoning tasks like prompt fusion and feature extraction
  const model = "gemini-3-pro-preview";
  
  const isMulti = mediaList.length > 1;
  
  let prompt = "";
  
  if (isMulti) {
    prompt = `你是一个专业的 AI 绘画提示词专家。
       请分析这 ${mediaList.length} 张图片，并提取它们的共同特征。
       
       ${fusionInstructions ? `用户特别要求如下：\n"${fusionInstructions}"\n请务必在融合时优先遵循这些要求。` : ""}
       
       任务目标：
       1. 提取所有图片的共同风格（如艺术流派、画法）、色调、光影效果和核心元素。
       2. 根据特征${fusionInstructions ? "及用户要求" : ""}，“融合”成一套最能代表这组图片精髓的 Positive Prompt (正向提示词)。
       3. 分析这些图片中应当避免的瑕疵、不和谐元素，生成一套通用的 Negative Prompt (反提示词)。
       
       输出要求：
       - Positive Prompt (English): 融合后的详细英文描述。
       - Positive Prompt (Chinese Translation): 中文翻译。
       - Negative Prompt (English): 融合后的反提示词列表。
       - Negative Prompt (Chinese Translation): 中文翻译。
       - Brief Description (English): 对这组图片风格融合后的整体描述。
       - Brief Description (Chinese): 中文总结。
       
       响应格式必须为 JSON。`;
  } else {
    prompt = `分析这个媒体文件并生成高质量的 AI 绘图/视频提示词。
       ${fusionInstructions ? `用户特别要求：\n"${fusionInstructions}"\n请在生成时结合此要求。` : ""}
       1. Positive Prompt (English): 描述主体、风格、光影、构图。
       2. Positive Prompt (Chinese Translation): 中文翻译。
       3. Negative Prompt (English): 避免的瑕疵、技术缺陷。
       4. Negative Prompt (Chinese Translation): 中文翻译。
       5. Brief Description (English): 简短描述。
       6. Brief Description (Chinese): 中文描述。
       
       响应格式必须为 JSON。`;
  }

  const mediaParts = mediaList.map(item => ({
    inlineData: {
      mimeType: item.mimeType,
      data: item.base64,
    },
  }));

  const response = await ai.models.generateContent({
    model,
    contents: { parts: [...mediaParts, { text: prompt }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          positivePrompt: { type: Type.STRING },
          positivePromptZh: { type: Type.STRING },
          negativePrompt: { type: Type.STRING },
          negativePromptZh: { type: Type.STRING },
          description: { type: Type.STRING },
          descriptionZh: { type: Type.STRING },
        },
        required: [
          "positivePrompt", 
          "positivePromptZh", 
          "negativePrompt", 
          "negativePromptZh", 
          "description", 
          "descriptionZh"
        ],
      },
    },
  });

  // Correctly access the .text property directly from GenerateContentResponse
  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  return JSON.parse(text) as PromptResult;
}
