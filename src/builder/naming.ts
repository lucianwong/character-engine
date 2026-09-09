const EXTENSION_RE = /\.[a-z0-9]+$/i;

const DIRECT_ALIASES: Record<string, string> = {
  body: "torso",
  chest: "torso",
  hip: "pelvis",
  hips: "pelvis",
  waist: "pelvis",
  face: "head",

  l_arm: "upper_arm_l",
  left_arm: "upper_arm_l",
  arm_l: "upper_arm_l",
  arm_left: "upper_arm_l",
  left_upper_arm: "upper_arm_l",
  upper_arm_left: "upper_arm_l",

  r_arm: "upper_arm_r",
  right_arm: "upper_arm_r",
  arm_r: "upper_arm_r",
  arm_right: "upper_arm_r",
  right_upper_arm: "upper_arm_r",
  upper_arm_right: "upper_arm_r",

  left_lower_arm: "forearm_l",
  lower_arm_left: "forearm_l",
  left_forearm: "forearm_l",
  forearm_left: "forearm_l",

  right_lower_arm: "forearm_r",
  lower_arm_right: "forearm_r",
  right_forearm: "forearm_r",
  forearm_right: "forearm_r",

  left_hand: "hand_l",
  hand_left: "hand_l",
  right_hand: "hand_r",
  hand_right: "hand_r",

  left_leg: "thigh_l",
  leg_left: "thigh_l",
  left_upper_leg: "thigh_l",
  upper_leg_left: "thigh_l",
  left_thigh: "thigh_l",
  thigh_left: "thigh_l",

  right_leg: "thigh_r",
  leg_right: "thigh_r",
  right_upper_leg: "thigh_r",
  upper_leg_right: "thigh_r",
  right_thigh: "thigh_r",
  thigh_right: "thigh_r",

  left_lower_leg: "calf_l",
  lower_leg_left: "calf_l",
  left_calf: "calf_l",
  calf_left: "calf_l",

  right_lower_leg: "calf_r",
  lower_leg_right: "calf_r",
  right_calf: "calf_r",
  calf_right: "calf_r",

  left_foot: "foot_l",
  foot_left: "foot_l",
  right_foot: "foot_r",
  foot_right: "foot_r",

  left_eye: "eye_l",
  eye_left: "eye_l",
  right_eye: "eye_r",
  eye_right: "eye_r",

  left_iris: "iris_l",
  iris_left: "iris_l",
  right_iris: "iris_r",
  iris_right: "iris_r",

  left_brow: "brow_l",
  eyebrow_left: "brow_l",
  brow_left: "brow_l",
  right_brow: "brow_r",
  eyebrow_right: "brow_r",
  brow_right: "brow_r",

  back_hair: "hair_back",
  rear_hair: "hair_back",
  front_hair: "hair_front",
};

export function sanitizePartName(input: string): string {
  return input
    .trim()
    .replace(EXTENSION_RE, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

function normalizeSideTokens(name: string): string {
  const tokens = name.split("_").filter(Boolean);
  const left = tokens.includes("left") || tokens.includes("l");
  const right = tokens.includes("right") || tokens.includes("r");

  if (left === right) return name;

  const side = left ? "l" : "r";
  const core = tokens.filter(
    (token) =>
      token !== "left" &&
      token !== "right" &&
      token !== "l" &&
      token !== "r",
  );

  const joined = core.join("_");

  const sidedCores = new Set([
    "upper_arm",
    "forearm",
    "lower_arm",
    "hand",
    "thigh",
    "upper_leg",
    "calf",
    "lower_leg",
    "foot",
    "eye",
    "iris",
    "brow",
    "eyebrow",
  ]);

  if (!sidedCores.has(joined)) return name;

  const canonicalCore =
    joined === "lower_arm"
      ? "forearm"
      : joined === "upper_leg"
        ? "thigh"
        : joined === "lower_leg"
          ? "calf"
          : joined === "eyebrow"
            ? "brow"
            : joined;

  return canonicalCore + "_" + side;
}

export function normalizePartName(input: string): string {
  const sanitized = sanitizePartName(input);
  return (
    DIRECT_ALIASES[sanitized] ??
    DIRECT_ALIASES[normalizeSideTokens(sanitized)] ??
    normalizeSideTokens(sanitized)
  );
}

export interface NormalizedPartName {
  input: string;
  sanitized: string;
  canonical: string;
  changed: boolean;
}

export function normalizePartNames(
  names: string[],
): NormalizedPartName[] {
  return names.map((input) => {
    const sanitized = sanitizePartName(input);
    const canonical = normalizePartName(input);
    return {
      input,
      sanitized,
      canonical,
      changed: canonical !== sanitized,
    };
  });
}
