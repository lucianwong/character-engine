import { PARAM } from "../parameters";
import { CharacterPack, ParameterDefinition } from "../types";

function p(
  id: string,
  min: number,
  max: number,
  defaultValue: number,
  description?: string,
): ParameterDefinition {
  return { id, min, max, default: defaultValue, description };
}

export function createMinimalCharacterPack(): CharacterPack {
  return {
    manifest: {
      schemaVersion: "2.0",
      id: "character-engine-minimal",
      name: "Character Engine Minimal",
      version: "0.1.0",
      rig: {
        ir: "rig/character.ir.json",
      },
    },
    ir: {
      schemaVersion: "2.0",
      id: "character-engine-minimal",
      parameters: {
        [PARAM.angleX]: p(PARAM.angleX, -30, 30, 0),
        [PARAM.angleY]: p(PARAM.angleY, -30, 30, 0),
        [PARAM.angleZ]: p(PARAM.angleZ, -30, 30, 0),
        [PARAM.bodyAngleX]: p(PARAM.bodyAngleX, -1, 1, 0),
        [PARAM.breath]: p(PARAM.breath, 0, 1, 0),
        [PARAM.eyeBallX]: p(PARAM.eyeBallX, -1, 1, 0),
        [PARAM.eyeBallY]: p(PARAM.eyeBallY, -1, 1, 0),
        [PARAM.eyeLOpen]: p(PARAM.eyeLOpen, 0, 1, 1),
        [PARAM.eyeROpen]: p(PARAM.eyeROpen, 0, 1, 1),
        [PARAM.mouthOpenY]: p(PARAM.mouthOpenY, 0, 1, 0),
        [PARAM.mouthForm]: p(PARAM.mouthForm, -1, 1, 0),
        [PARAM.mouthA]: p(PARAM.mouthA, 0, 1, 0),
        [PARAM.mouthE]: p(PARAM.mouthE, 0, 1, 0),
        [PARAM.mouthI]: p(PARAM.mouthI, 0, 1, 0),
        [PARAM.mouthO]: p(PARAM.mouthO, 0, 1, 0),
        [PARAM.mouthU]: p(PARAM.mouthU, 0, 1, 0),
        [PARAM.armL]: p(PARAM.armL, -1, 1, 0),
        [PARAM.elbowL]: p(PARAM.elbowL, -1, 1, 0),
        [PARAM.handL]: p(PARAM.handL, -1, 1, 0),
        [PARAM.armR]: p(PARAM.armR, -1, 1, 0),
        [PARAM.elbowR]: p(PARAM.elbowR, -1, 1, 0),
        [PARAM.handR]: p(PARAM.handR, -1, 1, 0)
      },
      parts: [
        { id: "torso", zIndex: 0 },
        {
          id: "head",
          parent: "torso",
          zIndex: 10,
          bindings: [
            { parameter: PARAM.angleX },
            { parameter: PARAM.angleY },
            { parameter: PARAM.angleZ }
          ]
        },
        {
          id: "arm_l",
          parent: "torso",
          zIndex: 5,
          bindings: [{ parameter: PARAM.armL }]
        },
        {
          id: "forearm_l",
          parent: "arm_l",
          zIndex: 6,
          bindings: [{ parameter: PARAM.elbowL }]
        },
        {
          id: "hand_l",
          parent: "forearm_l",
          zIndex: 7,
          bindings: [{ parameter: PARAM.handL }]
        },
        {
          id: "arm_r",
          parent: "torso",
          zIndex: 5,
          bindings: [{ parameter: PARAM.armR }]
        },
        {
          id: "forearm_r",
          parent: "arm_r",
          zIndex: 6,
          bindings: [{ parameter: PARAM.elbowR }]
        },
        {
          id: "hand_r",
          parent: "forearm_r",
          zIndex: 7,
          bindings: [{ parameter: PARAM.handR }]
        }
      ],
      actions: {
        idle: { loop: true },
        talk: { loop: true },
        listen: { loop: true },
        think: { loop: true },
        wave: { durationMs: 1800 },
        point: { durationMs: 1500 },
        sleep: { loop: true },
        wake: { durationMs: 1200 }
      }
    }
  };
}
