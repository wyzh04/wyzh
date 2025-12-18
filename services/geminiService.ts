
import { GoogleGenAI, Type } from "@google/genai";
import { PromptResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeMediaForPrompts(
  mediaList: {base64: string, mimeType: string}[], 
  fusionInstructions: string = ""
): Promise<PromptResult> {
  // 使用最强大的 Gemini 3 Pro 预览版进行像素级的特征推断
  const model = "gemini-3-pro-preview";
  
  const isMulti = mediaList.length > 1;
  
  // 核心升级逻辑：超写实视觉解构与权重语法
  const hyperExpertLogic = `
    你现在是一位“顶级视觉解构专家”和“AI 绘画提示词高级架构师”。
    你的目标是生成的提示词能让 Nano 级别的模型生成【极其准确且富有细节】的画面。

    ### 核心提示词构建逻辑 (Core Construction Logic):
    1. **像素级解构 (Pixel-Level Deconstruction)**: 
       - 不要只看表面。分析物体的【材质属性】（如：拉丝金属、哑光硅胶、湿润的皮肤纹理）。
       - 分析【物理光影】（如：侧逆光 rim lighting、次表面散射 subsurface scattering、全局照明 global illumination）。
    
    2. **权重增强语法 (Weight Injection)**:
       - 使用标准权重格式增强核心特征：(keyword:weight)。例如：(vibrant neon:1.3), (extremely detailed:1.2)。
       - 对于用户指令中的核心要求，必须使用最高权重 (1.4 - 1.5)。

    3. **四层属性堆叠 (Four-Layer Stack)**:
       - **Layer 1: Subject Detail**: 描述主体的每个细节（形状、颜色、姿态、表情的细微变化）。
       - **Layer 2: Environment & Atmosphere**: 描述环境的深度、天气、微尘、烟雾、季节感。
       - **Layer 3: Artistic Style & Media**: 描述画面的质感（如：Unreal Engine 5 render, 8k raw photo, macro photography, oil on canvas）。
       - **Layer 4: Technical Specs**: 镜头参数（35mm lens, f/1.8, cinematic bokeh, motion blur）。

    ### 针对 Nano 模型的特殊增强:
    - **词缀冗余**: Nano 模型需要多个同义词来强化理解。例如：想要高清，就同时使用 (highres, masterpiece, highly detailed, ultra-detailed, 8k)。
    - **避免歧义**: 使用具体的视觉动词和形容词，避免抽象概念。
    - **负向拦截**: 生成极度精细的负向词，阻断 Nano 模型常见的扭曲和模糊。

    ### 导演意图对齐 (Director Alignment):
    - 用户的【融合指令】是最高命令。如果指令说“赛博朋克”，哪怕参考图是水墨画，也要在提示词中通过高权重强制转型。
  `;
  
  let promptText = "";
  
  if (isMulti) {
    promptText = `
      ${hyperExpertLogic}
      
      【当前任务】：多图特征深度融合与重构 (Deep Multi-Source Fusion)
      【融合指令】："${fusionInstructions || "自动提取并融合最显著特征"}"
      
      要求：
      1. 分析这 ${mediaList.length} 张图的语义冲突点并进行平滑融合。
      2. 确保生成的 Positive Prompt 具有极其丰富的描述性词缀。
      3. 每组特征都要有 3-4 个细化词。
      
      输出 JSON 格式。
    `;
  } else {
    promptText = `
      ${hyperExpertLogic}
      
      【当前任务】：单图特写与细节扩充 (Single-Source Deep Expansion)
      【用户修改指令】："${fusionInstructions || "全方位提升画面细节与精细度"}"
      
      要求：
      1. 将该图的内容扩充为 50-80 个高质量提示词标签。
      2. 针对 Nano 模型，注入大量的物理属性描述。
      3. 严格遵循用户指令进行风格或内容的局部修改。
      
      输出 JSON 格式。
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
            description: "深度增强的英文标签提示词，包含权重语法" 
          },
          positivePromptZh: { 
            type: Type.STRING, 
            description: "对这些精细化标签的视觉逻辑解析" 
          },
          negativePrompt: { 
            type: Type.STRING, 
            description: "超长效负向拦截提示词" 
          },
          negativePromptZh: { 
            type: Type.STRING, 
            description: "负向词的中文说明" 
          },
          description: { 
            type: Type.STRING, 
            description: "AI 内部解析逻辑简述" 
          },
          descriptionZh: { 
            type: Type.STRING, 
            description: "大师级视觉重构报告（中文）" 
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
    console.error("Parse Error:", text);
    throw new Error("模型解析数据溢出，请减少指令复杂度并重试。");
  }
}
