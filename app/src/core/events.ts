import { emitter } from "../lib/emitter";
import { loadScene, getCurrentSceneIndex, setCurrentSceneIndex, MENU_SCENE_INDEX } from "./engine";
import {
  RequestFullscreen,
  RequestPointerlock,
  ExitPointerlock,
} from "@babylonjs/core/Engines/engine.common";
import type { Engine } from "@babylonjs/core/Engines/engine";
import { PLAYABLE_SCENES } from "./utils";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { lang } from "../lang";
import { PLAYABLE_SCENE_INDEX } from "./engine";
import { MenuUI } from "../app/menuUI";

export function registerEvents(
  canvas: HTMLCanvasElement,
  appEl: HTMLDivElement,
  engine: Engine,
  menuUI: MenuUI,
  options: any,
) {
  emitter.on("load-scene", async (evt: any) => {
    const name = evt as string;
    RequestPointerlock(canvas);
    if (options.fullscreen) {
      RequestFullscreen(appEl);
    }
    engine.loadingScreen.displayLoadingUI();
    await loadScene(name);
    engine.loadingScreen.hideLoadingUI();
  });

  emitter.on("show-menu", () => {
    if (getCurrentSceneIndex() === PLAYABLE_SCENE_INDEX) {
      engine.scenes[PLAYABLE_SCENE_INDEX].physicsEnabled = false;
    }
    ExitPointerlock();
    options.volume = 0;

    // update visibility
    menuUI.adt.getControlsByType("Button").forEach((b: any) => (b.isEnabled = true));
    menuUI.adt.getControlByName("menuContainer").isVisible = true;
    menuUI.adt.getControlByName("mainMenuPanel").isVisible = true;
    menuUI.adt.getControlByName("startMenuPanel").isVisible = false;
    menuUI.adt.getControlByName("settingsPanel").isVisible = false;

    if (engine.scenes.length === 2) {
      menuUI.adt.getControlByName("resumeBut").isVisible = true;
      menuUI.adt.getControlByName("startBut").isVisible = false;

      if (PLAYABLE_SCENES.length > 1) {
        menuUI.adt.getControlByName("startBut").isVisible = true;
        (menuUI.adt.getControlByName("startBut") as Button).textBlock.text =
          lang.screens.mainMenu.selectSceneText;
      } else {
        // restart not supported
      }
    }

    setCurrentSceneIndex(MENU_SCENE_INDEX);
  });

  emitter.on("resume-playable-scene", () => {
    menuUI.adt.getControlsByType("Button").forEach((b) => (b.isEnabled = false));
    setCurrentSceneIndex(PLAYABLE_SCENE_INDEX);
    engine.scenes[getCurrentSceneIndex()].physicsEnabled = true;
    options.volume = options.volume;
    RequestPointerlock(canvas);
    if (options.fullscreen) {
      RequestFullscreen(appEl);
    }
  });
}
