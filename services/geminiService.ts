
import { GoogleGenAI, Type } from "@google/genai";
import { GameState, CharacterClass, Item } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getInitialScenario = async (charClass: CharacterClass, items: Item[], location: string, karma: number) => {
  const prompt = `
    당신은 TRPG "Ethereal Ink"의 던전 마스터입니다.
    분위기는 어두운 중세, 시적이고 신비롭습니다. 반드시 한국어로 답변하십시오.

    캐릭터: ${charClass.name}
    보유 아이템: ${items.map(i => i.name).join(", ")}
    현재 위치: ${location}
    현재 카르마: ${karma} (0은 중립, 양수는 선함, 음수는 악함)
    
    이 장소에서 시작되는 장면을 묘사하십시오. 대기 상태와 분위기를 한 단락으로 설명한 뒤, 플레이어가 선택할 수 있는 3가지 행동을 제안하십시오.
    플레이어의 카르마에 따라 주변 인물들의 초기 반응이나 분위기가 달라져야 합니다.
    JSON 형식으로 응답하십시오.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          narrative: { type: Type.STRING },
          actions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                statRequired: { type: Type.STRING, description: "strength, intelligence, dexterity" },
                difficulty: { type: Type.NUMBER }
              }
            }
          }
        },
        required: ["narrative", "actions"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const processOutcome = async (
  gameState: GameState, 
  action: string, 
  rollResult: number, 
  success: boolean,
  currentScenario: string
) => {
  const prompt = `
    던전 마스터로서 이야기를 이어가십시오. 반드시 한국어로 답변하십시오.
    현재 상황: ${currentScenario}
    플레이어 행동: ${action}
    주사위 결과: ${rollResult} (성공 여부: ${success})
    현재 카르마: ${gameState.karma} (-100 ~ 100 사이)
    
    성공 여부에 따라 이야기를 진행하고 3가지 새로운 행동을 제안하십시오.
    
    규칙:
    1. 대화 가능한 인물(NPC)을 만난다면, 'specialInteraction' 필드에 'dialogue' 타입을 사용하십시오. NPC의 이름, 성격, 대화 내용을 포함해야 합니다. 선택지는 그에 맞는 대답이나 행동이 되어야 합니다.
    2. 수수께끼나 퀴즈가 필요한 상황(고대 상자 열기, 스핑크스 만나기 등)이라면 'specialInteraction' 필드에 'quiz' 타입을 사용하십시오. 질문과 정답을 포함하십시오.
    3. 카르마 반영: 선한 플레이어에겐 NPC가 협조적이고, 악한 플레이어에겐 적대적이거나 공포를 느낍니다.
    4. 골드 보상: 행동 성공 시 10~100 Gold.
    5. 카르마 변화: 선한 행동(+), 악한 행동(-).

    JSON 형식으로 응답하십시오.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          narrative: { type: Type.STRING },
          karmaDelta: { type: Type.NUMBER },
          goldReward: { type: Type.NUMBER },
          isSignificantEvent: { type: Type.BOOLEAN },
          specialInteraction: {
            type: Type.OBJECT,
            nullable: true,
            properties: {
              type: { type: Type.STRING, description: "quiz, dialogue" },
              question: { type: Type.STRING, description: "퀴즈 질문" },
              answer: { type: Type.STRING, description: "퀴즈 정답" },
              npcName: { type: Type.STRING },
              npcPersonality: { type: Type.STRING },
              npcDialogue: { type: Type.STRING }
            }
          },
          loot: {
            type: Type.OBJECT,
            nullable: true,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              rarity: { type: Type.STRING },
              type: { type: Type.STRING },
              statBonuses: {
                type: Type.OBJECT,
                properties: {
                  strength: { type: Type.NUMBER },
                  intelligence: { type: Type.NUMBER },
                  dexterity: { type: Type.NUMBER }
                }
              }
            }
          },
          actions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                statRequired: { type: Type.STRING },
                difficulty: { type: Type.NUMBER }
              }
            }
          }
        },
        required: ["narrative", "actions", "karmaDelta", "goldReward", "isSignificantEvent"]
      }
    }
  });

  return JSON.parse(response.text);
};
