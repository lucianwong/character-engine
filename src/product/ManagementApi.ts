import { DeviceCapabilities } from "./DeviceProfile";
import { CharacterPackRelease } from "./CharacterPackSync";

export interface CharacterDeviceRegistration {
  deviceId: string;
  name?: string;
  capabilities: DeviceCapabilities;
  installedCharacters?: Record<string, string>;
}

export interface CharacterDeploymentTarget {
  deviceId: string;
  characterId: string;
  version: string;
}

export interface CharacterManagementApi {
  registerDevice(
    registration: CharacterDeviceRegistration,
  ): Promise<void>;

  publishRelease(
    release: CharacterPackRelease,
  ): Promise<void>;

  deployCharacter(
    target: CharacterDeploymentTarget,
  ): Promise<void>;

  getLatestRelease(
    characterId: string,
    channel?: string,
  ): Promise<CharacterPackRelease | undefined>;
}
