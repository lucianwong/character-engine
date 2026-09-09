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
      version: "0.2.0-alpha.1",
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

        [PARAM.neckZ]: p(PARAM.neckZ, -1, 1, 0),
        [PARAM.pelvisX]: p(PARAM.pelvisX, -1, 1, 0),
        [PARAM.pelvisY]: p(PARAM.pelvisY, -1, 1, 0),
        [PARAM.pelvisZ]: p(PARAM.pelvisZ, -1, 1, 0),

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
        [PARAM.handR]: p(PARAM.handR, -1, 1, 0),

        [PARAM.thighL]: p(PARAM.thighL, -1, 1, 0),
        [PARAM.calfL]: p(PARAM.calfL, -1, 1, 0),
        [PARAM.footL]: p(PARAM.footL, -1, 1, 0),
        [PARAM.thighR]: p(PARAM.thighR, -1, 1, 0),
        [PARAM.calfR]: p(PARAM.calfR, -1, 1, 0),
        [PARAM.footR]: p(PARAM.footR, -1, 1, 0),
      },
      parts: [
        { id: "root", zIndex: -100 },
        {
          id: "pelvis",
          parent: "root",
          zIndex: 0,
          bindings: [
            { parameter: PARAM.pelvisX },
            { parameter: PARAM.pelvisY },
            { parameter: PARAM.pelvisZ },
          ],
        },
        {
          id: "torso",
          parent: "pelvis",
          zIndex: 5,
          bindings: [{ parameter: PARAM.bodyAngleX }],
        },
        {
          id: "neck",
          parent: "torso",
          zIndex: 9,
          bindings: [{ parameter: PARAM.neckZ }],
        },
        {
          id: "head",
          parent: "neck",
          zIndex: 10,
          bindings: [
            { parameter: PARAM.angleX },
            { parameter: PARAM.angleY },
            { parameter: PARAM.angleZ },
          ],
        },

        {
          id: "upper_arm_l",
          parent: "torso",
          zIndex: 6,
          bindings: [{ parameter: PARAM.armL }],
        },
        {
          id: "forearm_l",
          parent: "upper_arm_l",
          zIndex: 7,
          bindings: [{ parameter: PARAM.elbowL }],
        },
        {
          id: "hand_l",
          parent: "forearm_l",
          zIndex: 8,
          bindings: [{ parameter: PARAM.handL }],
        },
        {
          id: "upper_arm_r",
          parent: "torso",
          zIndex: 6,
          bindings: [{ parameter: PARAM.armR }],
        },
        {
          id: "forearm_r",
          parent: "upper_arm_r",
          zIndex: 7,
          bindings: [{ parameter: PARAM.elbowR }],
        },
        {
          id: "hand_r",
          parent: "forearm_r",
          zIndex: 8,
          bindings: [{ parameter: PARAM.handR }],
        },

        {
          id: "thigh_l",
          parent: "pelvis",
          zIndex: 1,
          bindings: [{ parameter: PARAM.thighL }],
        },
        {
          id: "calf_l",
          parent: "thigh_l",
          zIndex: 2,
          bindings: [{ parameter: PARAM.calfL }],
        },
        {
          id: "foot_l",
          parent: "calf_l",
          zIndex: 3,
          bindings: [{ parameter: PARAM.footL }],
        },
        {
          id: "thigh_r",
          parent: "pelvis",
          zIndex: 1,
          bindings: [{ parameter: PARAM.thighR }],
        },
        {
          id: "calf_r",
          parent: "thigh_r",
          zIndex: 2,
          bindings: [{ parameter: PARAM.calfR }],
        },
        {
          id: "foot_r",
          parent: "calf_r",
          zIndex: 3,
          bindings: [{ parameter: PARAM.footR }],
        },
      ],
      actions: {
        idle: { loop: true },
        talk: { loop: true },
        listen: { loop: true },
        think: { loop: true },
        wave: { durationMs: 1800 },
        point: { durationMs: 1500 },
        sleep: { loop: true },
        wake: { durationMs: 1200 },
      },
    },
  };
}
