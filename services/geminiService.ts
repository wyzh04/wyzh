
import { GoogleGenAI, Type } from "@google/genai";
import { PromptResult, TargetModel } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeMediaForPrompts(
  mediaList: {base64: string, mimeType: string}[], 
  fusionInstructions: string = "",
  targetModel: TargetModel = 'nano'
): Promise<PromptResult> {
  const model = "gemini-3-pro-preview";
  
  // Nano 模型：升级为“大师级视觉蓝图”模式，强化景别、视听语言与动作交互
  const nanoLogic = `
    【目标：Nano 级极致视觉蓝图架构】
    你现在的身份是“首席电影视觉指导”。你生成的提示词必须是像素级精确的。
    
    1. **空间与光学架构 (Perspective & Optics)**:
       - 必须明确视角：(Through the windshield:1.3), (Low-angle wide shot:1.2), (Anamorphic lens flare:1.1)。
       - 必须定义焦段与虚化：(85mm prime lens:1.2), (F/1.4 shallow depth of field:1.3), (Bokeh background:1.1)。
    
    2. **视听语言与大气表现 (Cinematic FX & Atmosphere)**:
       - 强调光影质感：(Volumetric lighting:1.3), (Cyberpunk neon blue bioluminescence:1.4), (Dramatic chiaroscuro:1.2)。
       - 环境动态表现：(Motion blur on tropical foliage:1.3), (Floating dust particles:1.1), (Misty rainforest haze:1.2)。
       - 色彩科学：(Teal and orange color grading:1.2), (Cold blue ambient light:1.3), (Warm interior cockpit glow:1.4)。
    
    3. **人物表演与精细动作 (Character Performance & Action)**:
       - 极其细致的动作：(Driver's hands firmly gripping the steering wheel:1.3), (Co-driver tilting head with a subtle smile:1.4), (Gaze directed out the side window:1.2)。
       - 肌肉与神态：(Tensed facial muscles:1.1), (Gentle reflection in pupils:1.2), (Individual strands of hair tensed by the wind:1.1)。
    
    4. **材质与硬表面精度 (Material & Hardware Precision)**:
       - 具体的物体特征：(Purple metallic SUV paint:1.3), (Perforated leather seat texture:1.2), (OLED dashboard interface glow:1.4)。
    
    5. **语法风格**: 混合使用 (keyword:weight) 权重语法与长句描述。
  `;

  // Sora 2 模型：保持叙事化视频描述
  const sora2Logic = `
    【目标：Sora 2 高阶视频/电影感生成】
    1. **叙事逻辑**: 采用长篇幅、自然语言描述。必须包含[场景初始状态] -> [发生的动态行为] -> [环境反应]。
    2. **镜头轨迹 (Camera Choreography)**: 
       - 必须包含具体的运动指令：Tracking shot, Pan-tilt, Drone perspective, Cinematic orbit.
    3. **物理与动态 (Physics & Motion)**:
       - 描述动作的质感与物理连贯性。
    4. **时间维度**: 描述动作的速度演变。
  `;
  
  const systemInstruction = `
    你是一位顶尖的“视觉指令架构师”。你的任务是将参考图的精髓与用户的“导演意图”完美融合，转化为 AI 模型能理解的最高阶指令。

    ### 核心对齐原则:
    ${targetModel === 'nano' ? nanoLogic : sora2Logic}

    ### 导演意图核心化:
    用户当前的导演意图是: "${fusionInstructions || "基于参考图执行全方位的像素重构"}"
    你的提示词必须【绝对优先】体现导演意图，将其转化为画面中最重要的视觉支点。
  `;
  
  const promptText = `
    ${systemInstruction}
    
    【执行分析任务】：
    1. 识别参考图的景别（大全景/中景/特写/微距）。
    2. 捕捉参考图的光学属性（光质、光位、色温）。
    3. 详细解构人物的动作、朝向、细微表情。
    4. 描述环境的交互关系（反射、遮挡、大气干扰）。
    5. 根据目标模型 ${targetModel.toUpperCase()} 的逻辑输出结果。
    
    请输出 JSON 格式。
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
            description: "最终生成的英文正向提示词蓝图" 
          },
          positivePromptZh: { 
            type: Type.STRING, 
            description: "中文视觉逻辑解析（包含对景别、镜头语言和动作的专业说明）" 
          },
          negativePrompt: { 
            type: Type.STRING, 
            description: "英文负向拦截词库" 
          },
          negativePromptZh: { 
            type: Type.STRING, 
            description: "负向规避逻辑解析" 
          },
          description: { 
            type: Type.STRING, 
            description: "Technical Summary (English)" 
          },
          descriptionZh: { 
            type: Type.STRING, 
            description: "大师级架构报告（中文，总结视觉设计的艺术性）" 
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
    throw new Error("语义引擎过载，解析失败。");
  }
}
