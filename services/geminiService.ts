
import { GoogleGenAI, Type } from "@google/genai";
import { PromptResult, TargetModel } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzeMediaForPrompts(
  mediaList: {base64: string, mimeType: string}[], 
  fusionInstructions: string = "",
  targetModel: TargetModel = 'nano'
): Promise<PromptResult> {
  const model = "gemini-3-pro-preview";
  
  // Nano 模型：大师级视觉蓝图架构
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

  // Sora 2 模型：时空推演与物理叙事架构
  const sora2Logic = `
    【目标：Sora 2 视频生成核心架构】
    你现在的身份是“Sora 物理引擎构建师”与“电影导演”。
    你不仅要描述静态画面，更要通过静态图像【反推】出一段连贯的视频脚本。
    
    1. **视频意图识别 (Video Intent Recognition)**:
       - **关键**: 识别画面中的“势能”。例如，车在行驶吗？速度多快？雨是直下还是斜飘（暗示风速）？
       - 即使是静态参考图，也要描述出【正在发生】的动作，而不是静止的状态。
    
    2. **时空连续性 (Temporal Continuity)**:
       - 描述时间轴：(Beginning: The car approaches from the dark) -> (Action: It speeds past the camera with a doppler effect) -> (End: Taillights fade into the mist).
       - 确保动作的连贯性，像写小说一样描述一段 5-10 秒的剧情。
    
    3. **电影级运镜 (Cinematography & Camera Movement)**:
       - **必须**包含具体的运镜指令：
         - (Tracking shot matching the vehicle's speed)
         - (Slow cinematic push-in through the glass)
         - (Low angle dolly shot emphasizing speed)
         - (Handheld camera shake for realism)
    
    4. **物理交互与环境反馈 (Physics & Environmental Feedback)**:
       - 描述环境如何“活着”：(Fog swirling around the chassis), (Raindrops streaking horizontally on the windshield), (Neon lights reflecting dynamically on the wet hood).
       - 描述人物的微动态：(Subtle vibrations of the steering wheel), (Hair gently swaying from AC vent airflow).
    
    5. **Sora 提示词结构**: 
       - 输出一段完整的、极具沉浸感的英文长段落（Caption-style）。
       - 结构：[镜头运动方式] + [核心动态主体] + [环境物理反馈] + [光影流转] + [美学风格]。
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
    1. **视频动态推演**: 这是一个静态帧，请想象它的前一秒和后一秒发生了什么？(如：车辆正在加速、树叶正在后退)。
    2. **物理细节模拟**: 空气中的颗粒、光线的折射、材质的震动感。
    3. **镜头语言设计**: 摄影机在哪里？它是固定的还是移动的？
    4. **Sora 专属优化**: 输出符合 Sora 物理引擎逻辑的长文本描述。
    
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
            description: targetModel === 'nano' ? "最终生成的英文正向提示词蓝图" : "Sora 2 专用的沉浸式视频脚本（英文长文本）" 
          },
          positivePromptZh: { 
            type: Type.STRING, 
            description: "中文视觉逻辑解析（包含镜头轨迹、物理动态和时间演变的专业说明）" 
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
            description: "大师级架构报告（中文，总结动态意图与叙事张力）" 
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
