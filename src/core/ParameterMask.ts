import { PARAM } from "../parameters";
import { ParameterFrame, ParameterId } from "../types";

export type ParameterMask = ReadonlySet<ParameterId>;

export const PARAMETER_MASKS = {
  face: new Set<ParameterId>([
    PARAM.angleX,
    PARAM.angleY,
    PARAM.angleZ,
    PARAM.eyeBallX,
    PARAM.eyeBallY,
    PARAM.eyeLOpen,
    PARAM.eyeROpen,
    PARAM.mouthOpenY,
    PARAM.mouthForm,
    PARAM.mouthA,
    PARAM.mouthE,
    PARAM.mouthI,
    PARAM.mouthO,
    PARAM.mouthU,
  ]),

  upperBody: new Set<ParameterId>([
    PARAM.bodyAngleX,
    PARAM.neckZ,
    PARAM.armL,
    PARAM.elbowL,
    PARAM.handL,
    PARAM.armR,
    PARAM.elbowR,
    PARAM.handR,
  ]),

  lowerBody: new Set<ParameterId>([
    PARAM.pelvisX,
    PARAM.pelvisY,
    PARAM.pelvisZ,
    PARAM.thighL,
    PARAM.calfL,
    PARAM.footL,
    PARAM.thighR,
    PARAM.calfR,
    PARAM.footR,
  ]),
} as const;

export function applyParameterMask(
  frame: ParameterFrame,
  mask: ParameterMask,
): ParameterFrame {
  const result: ParameterFrame = {};
  for (const [id, value] of Object.entries(frame)) {
    if (mask.has(id)) result[id] = value;
  }
  return result;
}

export function combineParameterMasks(
  ...masks: ParameterMask[]
): ParameterMask {
  const result = new Set<ParameterId>();
  for (const mask of masks) {
    for (const id of mask) result.add(id);
  }
  return result;
}
