import {
  CharacterIR,
  CharacterPack,
  CharacterPackManifest,
} from "../types";
import { assertValidCharacterPack } from "../character-ir/validate";

export function loadCharacterPackFromJson(
  manifestJson: string,
  irJson: string,
): CharacterPack {
  const manifest = JSON.parse(manifestJson) as CharacterPackManifest;
  const ir = JSON.parse(irJson) as CharacterIR;
  const pack = { manifest, ir };
  assertValidCharacterPack(pack);
  return pack;
}
