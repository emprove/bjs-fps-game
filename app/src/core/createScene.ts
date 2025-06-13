import type { AudioEngineV2 } from "@babylonjs/core/AudioV2/abstractAudio/audioEngineV2";
import type { Scene } from "@babylonjs/core/scene";
import type { Engine } from "@babylonjs/core/Engines/engine";
import { BUILD_SCENE_LIST } from "./utils";

export interface CreateSceneClass {
  init: (engine: Engine, audioEngine: AudioEngineV2) => Promise<Scene>;
}

const sceneMap: Record<string, CreateSceneClass> = {};

export const getSceneModule = async (name: string): Promise<CreateSceneClass> => {
  if (BUILD_SCENE_LIST.includes("unoGarden")) {
    sceneMap["unoGarden"] = (await import("../scenes/unoGarden/index")).default;
  }

  const scene = sceneMap[name];
  if (!scene) {
    throw new Error(`Scene ${name} not found`);
  }

  return scene;
};
