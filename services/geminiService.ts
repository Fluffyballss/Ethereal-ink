
import { GoogleGenAI, Type } from "@google/genai";
import { GameState, CharacterClass, Item } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getInitialScenario = async (charClass: CharacterClass, items: Item[], location: string, karma: number) => {
  const prompt = `
    당신은 TRPG "Ethereal Ink"의 던전 마스터입니다.
    분위기는 어두운 중세, 시적이고 신비롭습니다. 반드시 한국어로 답변하십시오.
    캐릭터: ${charClass.name}, 보유 아이템: ${items.map(i => i.name).join(", ")}, 현재 위치: ${location}, 현재 카르마: ${karma}
    장면을 묘사하고 플레이어가 선택할 수 있는 3가지 행동을 제안하십시오. JSON으로 응답하십시오.
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
    현재 상황: ${currentScenario}
    플레이어 행동: ${action}, 주사위 결과: ${rollResult}, 성공 여부: ${success}
    성공 여부에 따라 이야기를 이어가고 새로운 행동 3가지를 제안하십시오.
    아이템 보상(loot)은 정수 수치의 능력치 보너스를 포함해야 합니다. JSON으로 응답하십시오.
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
              type: { type: Type.STRING },
              question: { type: Type.STRING },
              answer: { type: Type.STRING },
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
