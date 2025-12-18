
import { GoogleGenAI, Type } from "@google/genai";
import { PromptResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeMediaForPrompts(
  mediaList: {base64: string, mimeType: string}[], 
  fusionInstructions: string = ""
): Promise<PromptResult> {
  // 使用 Gemini 3 Pro 预览版进行深度的视觉推理
  const model = "gemini-3-pro-preview";
  
  const isMulti = mediaList.length > 1;
  
  // 深度专家逻辑：视觉解构与指令合成
  const expertLogic = `
    你现在是一位“视觉语义架构师”和“端侧模型(Nano)提示词工程师”。
    你的任务是深度理解用户的【融合指令】，并将上传的【参考素材】作为语义库进行解构。

    ### 深度理解逻辑 (Deep Understanding Logic):
    1. **解构 (Deconstruct)**: 分析图片中的核心主体(Subject)、视觉风格(Style)、材质(Texture)、构图(Composition)和光影(Lighting)。
    2. **对齐 (Align)**: 严格遵循用户的【融合指令】。如果指令要求改变风格，则将图片的风格属性剔除，替换为指令要求的属性。
    3. **合成 (Synthesize)**: 针对 Nano 模型的注意力机制，将解构出的元素重新排列。Nano 模型对句首词汇和简单重复词汇更敏感。

    ### Nano 优化准则 (Nano Optimization Guidelines):
    - **标签化结构**: 采用 [Subject], [Specific Style], [High-Impact Modifiers], [Environment], [Tech Specs] 的顺序。
    - **权重增强**: 对于核心指令提到的元素，通过增加修饰语（如: highly detailed, intricate, extremely）来增强权重。
    - **规避长句**: 严禁使用 "A photo of..." 或 "There is a..." 等修饰性废话。
    - **负向提示词**: 必须针对融合可能产生的副作用（如风格混杂、肢体冲突）生成规避词。

    ### 融合指令处理优先级:
    - 优先级 1: 用户的【融合指令】中的明确变化要求（如：“把背景换成红色”）。
    - 优先级 2: 参考图片中被指令要求“保留”的核心特征。
    - 优先级 3: 未被指令覆盖的其他视觉细节。
  `;
  
  let promptText = "";
  
  if (isMulti) {
    promptText = `
      ${expertLogic}
      
      【当前场景】：多图融合分析 (Multi-Image Fusion)
      【上传素材数量】：${mediaList.length} 张
      【融合指令】："${fusionInstructions || "自动提取共同特征并融合"}"
      
      请执行以下操作：
      1. 找出素材间的视觉关联点。
      2. 严格执行融合指令中的“导演意图”。
      3. 输出一套逻辑统一、具有高度视觉表现力的提示词。
      
      输出 JSON。
    `;
  } else {
    promptText = `
      ${expertLogic}
      
      【当前场景】：单图深度重构 (Single-Image Re-imagining)
      【融合指令/特别要求】："${fusionInstructions || "生成精准描述"}"
      
      请执行以下操作：
      1. 解构单张图片的视觉精髓。
      2. 根据特别要求进行“语义重写”（Semantic Rewriting）。
      3. 生成最能触达 Nano 模型生成潜力的提示词。
      
      输出 JSON。
    `;
  }

  const mediaParts = mediaList.map(item => ({
    inlineData: {
      mimeType: item.mimeType,
      data: item.base64,
    },
  }));

  const response = await ai.models.generateContent({
    model,
    contents: { parts: [...mediaParts, { text: promptText }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          positivePrompt: { 
            type: Type.STRING, 
            description: "针对 Nano 优化的英文标签化正向提示词" 
          },
          positivePromptZh: { 
            type: Type.STRING, 
            description: "提示词的中文深度解析与创作建议" 
          },
          negativePrompt: { 
            type: Type.STRING, 
            description: "针对融合冲突优化的英文负向提示词" 
          },
          negativePromptZh: { 
            type: Type.STRING, 
            description: "负向词的中文含义" 
          },
          description: { 
            type: Type.STRING, 
            description: "本次融合解析的逻辑链条（英文简述）" 
          },
          descriptionZh: { 
            type: Type.STRING, 
            description: "本次融合解析的逻辑链条（中文简述，解释 AI 是如何理解用户指令的）" 
          },
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

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  try {
    return JSON.parse(text) as PromptResult;
  } catch (e) {
    console.error("JSON Parse Error:", text);
    throw new Error("AI 返回数据格式异常，请重试。");
  }
}
