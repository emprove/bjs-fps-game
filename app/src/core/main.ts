import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Scene } from "@babylonjs/core/scene";
import type { Engine } from "@babylonjs/core/Engines/engine";
// core
import { initEngine, loadScene, audioEngine, getCurrentSceneIndex } from "./engine";
import {
  createPwaToast,
  createLoader,
  initLoadingScreenLogic,
  loadingScreenReadyToStart,
} from "./ui";
import { registerEvents } from "./events";
import { getSceneNameFromURI, setFavicon, PLAYABLE_SCENES } from "./utils";
import { MenuUI as MenuUI } from "../app/menuUI";
import { CustomLoadingScreen } from "./loadingScreen";
import { initPWA } from "../pwa";
import { options } from "./options";

export const canvasEl = document.getElementById("renderCanvas") as HTMLCanvasElement;
export const appEl = document.getElementById("app") as HTMLDivElement;

const createMenu = (engine: Engine): MenuUI => {
  const menuScene = new Scene(engine);
  new ArcRotateCamera("cameraMenu", 0, 0, 10, Vector3.Zero(), menuScene);
  const menuUI = new MenuUI(menuScene, audioEngine);
  menuUI.init();

  return menuUI;
};

const loadSceneIfParamInURI = async () => {
  let sceneName = getSceneNameFromURI();
  const playableNames = PLAYABLE_SCENES.map((s) => s.name);
  if (sceneName && !playableNames.includes(sceneName)) {
    history.replaceState({}, "", location.pathname);
    sceneName = undefined;
  }
  if (sceneName) {
    await loadScene(sceneName);
  }
};

export async function bootApp(): Promise<void> {
  createPwaToast(appEl);
  createLoader(appEl, import.meta.env.VITE_PWA_ICON_192);
  setFavicon(import.meta.env.VITE_PWA_ICON_192, "icon");
  setFavicon(import.meta.env.VITE_PWA_ICON_192, "apple-touch-icon");

  const engine = await initEngine(canvasEl);
  const menuUI = createMenu(engine);
  engine.loadingScreen = new CustomLoadingScreen(menuUI);

  await loadSceneIfParamInURI();
  initLoadingScreenLogic(appEl, options.fullscreen);
  registerEvents(canvasEl, appEl, engine, menuUI, options);

  engine.runRenderLoop(() => {
    engine.scenes[getCurrentSceneIndex()].render();
  });

  loadingScreenReadyToStart();
  initPWA(appEl);
}
