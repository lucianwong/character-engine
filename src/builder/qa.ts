import { validateCharacterPack } from "../character-ir/validate";
import { PARAM } from "../parameters";
import { CharacterPack } from "../types";

export type QaSeverity = "error" | "warning" | "info";

export interface QaFinding {
  severity: QaSeverity;
  code: string;
  message: string;
  path?: string;
}

export interface CharacterQaReport {
  passed: boolean;
  score: number;
  findings: QaFinding[];
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
}

const REQUIRED_BODY_PARTS = [
  "pelvis",
  "torso",
  "neck",
  "head",
  "upper_arm_l",
  "forearm_l",
  "hand_l",
  "upper_arm_r",
  "forearm_r",
  "hand_r",
  "thigh_l",
  "calf_l",
  "foot_l",
  "thigh_r",
  "calf_r",
  "foot_r",
];

const REQUIRED_PARAMETERS = [
  PARAM.angleX,
  PARAM.angleY,
  PARAM.angleZ,
  PARAM.eyeBallX,
  PARAM.eyeBallY,
  PARAM.eyeLOpen,
  PARAM.eyeROpen,
  PARAM.mouthOpenY,
  PARAM.armL,
  PARAM.elbowL,
  PARAM.handL,
  PARAM.armR,
  PARAM.elbowR,
  PARAM.handR,
  PARAM.pelvisX,
  PARAM.pelvisY,
  PARAM.pelvisZ,
  PARAM.thighL,
  PARAM.calfL,
  PARAM.footL,
  PARAM.thighR,
  PARAM.calfR,
  PARAM.footR,
];

export function generateCharacterQaReport(
  pack: CharacterPack,
): CharacterQaReport {
  const findings: QaFinding[] = [];

  for (const issue of validateCharacterPack(pack)) {
    findings.push({
      severity: "error",
      code: "schema.invalid",
      message: issue.message,
      path: issue.path,
    });
  }

  const parts = new Map(pack.ir.parts.map((part) => [part.id, part]));

  for (const id of REQUIRED_BODY_PARTS) {
    if (!parts.has(id)) {
      findings.push({
        severity: "error",
        code: "humanoid.part_missing",
        message: "Required full-body part is missing: " + id,
        path: "ir.parts",
      });
    }
  }

  for (const parameter of REQUIRED_PARAMETERS) {
    if (!pack.ir.parameters[parameter]) {
      findings.push({
        severity: "error",
        code: "humanoid.parameter_missing",
        message: "Required parameter is missing: " + parameter,
        path: "ir.parameters." + parameter,
      });
    }
  }

  for (const id of REQUIRED_BODY_PARTS) {
    const part = parts.get(id);
    if (!part) continue;

    if (!part.pivot && id !== "torso") {
      findings.push({
        severity: "warning",
        code: "rig.pivot_missing",
        message: "Part has no measured pivot/anchor: " + id,
        path: "ir.parts." + id + ".pivot",
      });
    }
  }

  const actionNames = new Set(Object.keys(pack.ir.actions ?? {}));
  for (const action of ["idle", "talk", "listen", "think", "wave"]) {
    if (!actionNames.has(action)) {
      findings.push({
        severity: "warning",
        code: "motion.action_missing",
        message: "Recommended action is missing: " + action,
        path: "ir.actions",
      });
    }
  }

  const errors = findings.filter(
    (finding) => finding.severity === "error",
  ).length;
  const warnings = findings.filter(
    (finding) => finding.severity === "warning",
  ).length;
  const info = findings.filter(
    (finding) => finding.severity === "info",
  ).length;

  const score = Math.max(
    0,
    Math.min(100, 100 - errors * 20 - warnings * 2),
  );

  return {
    passed: errors === 0,
    score,
    findings,
    summary: { errors, warnings, info },
  };
}
