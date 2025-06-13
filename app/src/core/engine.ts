import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { CreateAudioEngineAsync } from "@babylonjs/core/AudioV2/webAudio/webAudioEngine";
import type { AudioEngineV2 } from "@babylonjs/core/AudioV2/abstractAudio/audioEngineV2";
import { getSceneModule } from "./createScene";

export const MENU_SCENE_INDEX = 0;
export const PLAYABLE_SCENE_INDEX = 1;
export let engine: Engine;
export let audioEngine: AudioEngineV2;
let renderingSceneIndex: number = MENU_SCENE_INDEX;

export async function initEngine(canvas: HTMLCanvasElement): Promise<Engine> {
  const options = {
    preserveDrawingBuffer: true,
    stencil: true,
    disableWebGL2Support: false,
    doNotHandleContextLost: false,
  };

  engine = new Engine(canvas, false, options);
  engine.getCaps().parallelShaderCompile = undefined;
  engine.enableOfflineSupport = false;

  audioEngine = await CreateAudioEngineAsync();

  window.addEventListener("fullscreenchange", () => engine.resize());
  window.addEventListener("resize", () => engine.resize());
  window.addEventListener("beforeunload", () => engine.dispose());

  return engine;
}

export async function loadScene(sceneName: string): Promise<Scene> {
  // dispose old playable scenes
  engine.scenes.forEach((scn, idx) => {
    if (idx >= PLAYABLE_SCENE_INDEX) {
      scn.dispose();
    }
  });

  const sceneModule = await getSceneModule(sceneName);
  const scene = await sceneModule.init(engine, audioEngine);
  renderingSceneIndex = PLAYABLE_SCENE_INDEX;

  if (import.meta.env.DEV && location.search.includes("debug")) {
    engine.scenes[renderingSceneIndex].debugLayer.show();
  }

  return scene;
}

export function getCurrentSceneIndex(): number {
  return renderingSceneIndex;
}

export function setCurrentSceneIndex(idx: number): void {
  renderingSceneIndex = idx;
}
