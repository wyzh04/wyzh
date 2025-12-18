
import { GoogleGenAI, Type } from "@google/genai";
import { PromptResult, TargetModel } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeMediaForPrompts(
  mediaList: {base64: string, mimeType: string}[], 
  fusionInstructions: string = "",
  targetModel: TargetModel = 'nano'
): Promise<PromptResult> {
  const model = "gemini-3-pro-preview";
  
  const isMulti = mediaList.length > 1;

  // Nano 模型：极致标签化 + 物理权重 (适用于 SD Nano, Flux, etc.)
  const nanoLogic = `
    【目标：Nano 级高精度图像生成】
    1. **语法结构**: 采用 (keyword:weight) 权重语法。
    2. **属性堆叠**: 
       - [主体]: 极尽详细的物理特征 (iris texture, skin pores, fabric weave)。
       - [环境]: 丁达尔效应, 焦外虚幻, 体积光。
       - [参数]: 8k resolution, photorealistic, Unreal Engine 5 render style.
    3. **策略**: 用冗余的同义词增强模型对指令的注意力。
  `;

  // Sora 2 模型：叙事化视频描述 + 镜头轨迹 (适用于 Sora, Kling, Vidu, etc.)
  const sora2Logic = `
    【目标：Sora 2 高阶视频/电影感生成】
    1. **叙事逻辑**: 采用长篇幅、自然语言描述。必须包含[场景初始状态] -> [发生的动态行为] -> [环境反应]。
    2. **镜头轨迹 (Camera Choreography)**: 
       - 必须包含具体的运动指令：Tracking shot, Pan-tilt, Drone perspective, Cinematic orbit.
       - 指定焦距感：Macro close-up, wide-angle panoramic.
    3. **物理与动态 (Physics & Motion)**:
       - 描述动作的质感：Fluid, weightful, elastic, high-velocity.
       - 强调颗粒感与材质动态：Swirling dust in light beams, rippling water surfaces.
    4. **时间维度**: 描述动作的速度变化（如：slow-motion ramp, timelapse feel）。
  `;
  
  const systemInstruction = `
    你是一位享誉全球的“视觉指令架构师”，精通各种 AI 生成模型的底层逻辑。
    当前你的任务是根据用户上传的素材，为特定的【目标模型】编写最高标准的提示词。

    ### 核心对齐原则:
    ${targetModel === 'nano' ? nanoLogic : sora2Logic}

    ### 导演意图 (Director's Intent):
    用户指令: "${fusionInstructions || "基于参考图进行超现实重构"}"
    如果指令要求修改，必须在提示词中占据主导地位，用强烈的动词和形容词来体现这种转变。
  `;
  
  const promptText = `
    ${systemInstruction}
    
    【执行分析】：
    素材详情：${mediaList.length} 张图片参考
    目标模型：${targetModel.toUpperCase()}
    请深入分析参考图的：1.构图骨架 2.色彩调性 3.核心元素 4.材质细节。
    
    输出 JSON 格式。
  `;

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
            description: targetModel === 'nano' ? "英文标签权重提示词" : "叙事化英文视频描述" 
          },
          positivePromptZh: { 
            type: Type.STRING, 
            description: "对应的中文视觉逻辑解析" 
          },
          negativePrompt: { 
            type: Type.STRING, 
            description: "英文负向拦截词" 
          },
          negativePromptZh: { 
            type: Type.STRING, 
            description: "负向词解析" 
          },
          description: { 
            type: Type.STRING, 
            description: "AI 架构简述（英文）" 
          },
          descriptionZh: { 
            type: Type.STRING, 
            description: "大师级视觉解析报告（中文）" 
          },
        },
        required: ["positivePrompt", "positivePromptZh", "negativePrompt", "negativePromptZh", "description", "descriptionZh"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("AI failed to respond");
  
  try {
    return JSON.parse(text) as PromptResult;
  } catch (e) {
    throw new Error("语义引擎过载，请简化您的描述。");
  }
}
