import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { TextBlock, TextWrapping } from "@babylonjs/gui/2D/controls/textBlock";
import { Container } from "@babylonjs/gui/2D/controls/container";
import { Tools } from "@babylonjs/core/Misc/tools";
import { Ellipse } from "@babylonjs/gui/2D/controls/ellipse";
import { KeyboardEventTypes } from "@babylonjs/core/Events/keyboardEvents";
import type { Scene } from "@babylonjs/core/scene";
import type { Engine } from "@babylonjs/core/Engines/engine";
// app
import { emitter } from "../lib/emitter";
import { canvasEl } from "../core/main";
import { lang } from "../lang";
import { device } from "../lib/deviceDetection";
import { options } from "../core/options";
// assets
import menuIcon from "../assets/icons/menu.png";
import screenshotIcon from "../assets/icons/photo.png";

export class SceneUI {
  #engine: Engine;
  #scene: Scene;
  public adt: AdvancedDynamicTexture;

  constructor(engine: Engine, scene: Scene) {
    this.#engine = engine;
    this.#scene = scene;
    this.adt = AdvancedDynamicTexture.CreateFullscreenUI("sceneUI", true, scene);
  }

  init() {
    const menuButtonContainer = new Container("menuButtonContainer");
    this.adt.addControl(menuButtonContainer);

    menuButtonContainer.width = "40px";
    menuButtonContainer.height = "70px";
    menuButtonContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    menuButtonContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    menuButtonContainer.left = 10;
    menuButtonContainer.top = 10;
    menuButtonContainer.zIndex = 1;

    const menuButton = Button.CreateImageOnlyButton("menuButton", menuIcon);
    menuButtonContainer.addControl(menuButton);

    menuButton.width = "40px";
    menuButton.height = "40px";
    menuButton.thickness = 0;
    menuButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    menuButton.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    menuButton.alpha = 0.6;
    menuButton.isVisible = true;

    if (device.isDesktop) {
      const menuButtonNote = new TextBlock("menuButtonNote", "Tab");
      menuButtonContainer.addControl(menuButtonNote);

      menuButtonNote.height = "20px";
      menuButtonNote.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
      menuButtonNote.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
    }

    menuButton.onPointerClickObservable.add(() => {
      emitter.emit("show-menu");
    });

    const fpsLabel = new TextBlock("fpsLabel");
    this.adt.addControl(fpsLabel);

    fpsLabel.width = "35px";
    fpsLabel.height = "35px";
    fpsLabel.color = "black";
    fpsLabel.fontSize = 24;
    fpsLabel.paddingTopInPixels = 10;
    fpsLabel.paddingRightInPixels = 10;
    fpsLabel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    fpsLabel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

    // screenshot
    const screenshotButtonContainer = new Ellipse("screenshotButtonContainer");
    this.adt.addControl(screenshotButtonContainer);

    screenshotButtonContainer.width = "40px";
    screenshotButtonContainer.height = "40px";
    screenshotButtonContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    screenshotButtonContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    screenshotButtonContainer.left = 10;
    screenshotButtonContainer.top = 50;
    screenshotButtonContainer.alpha = 0.4;
    screenshotButtonContainer.thickness = 0;
    screenshotButtonContainer.background = "black";
    screenshotButtonContainer.zIndex = 1;

    if (device.isDesktop) {
      screenshotButtonContainer.top = 100;
    } else {
      screenshotButtonContainer.top = 70;
    }

    const screenshotBut = Button.CreateImageOnlyButton("screenshotBut", screenshotIcon);
    screenshotButtonContainer.addControl(screenshotBut);

    screenshotBut.width = "26px";
    screenshotBut.height = "26px";
    screenshotBut.thickness = 0;
    screenshotBut.top = 6;
    screenshotBut.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    screenshotBut.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    screenshotBut.alpha = 0.6;
    screenshotBut.isVisible = true;

    screenshotBut.onPointerClickObservable.add(async () => {
      await this.screenshot();
    });

    if (device.isDesktop) {
      const screenshotButNote = new TextBlock(
        "screenshotButNote",
        lang.screens.playableScene.screenshotButNote,
      );
      this.adt.addControl(screenshotButNote);

      screenshotButNote.top = 140;
      screenshotButNote.left = 10;
      screenshotButNote.fontSize = 12;
      screenshotButNote.resizeToFit = true;
      screenshotButNote.textWrapping = TextWrapping.WordWrap;
      screenshotButNote.width = "40px";
      screenshotButNote.height = "50px";
      screenshotButNote.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      screenshotButNote.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    }

    this.#scene.onKeyboardObservable.add(async (kbInfo) => {
      switch (kbInfo.type) {
        case KeyboardEventTypes.KEYUP:
          switch (kbInfo.event.code) {
            case "PrintScreen":
              await this.screenshot();
              break;
          }
          break;
      }
    });
  }

  private changePixelDensity(val: number) {
    return new Promise((resolve) => {
      this.#engine.setHardwareScalingLevel(val);
      this.adt.renderScale = this.#engine.getHardwareScalingLevel();
      resolve(true);
    });
  }

  private async screenshot() {
    await this.changePixelDensity(1 / window.devicePixelRatio);
    this.adt.executeOnAllControls((control) => (control.isVisible = !control.isVisible));

    let base64 = await Tools.CreateScreenshotAsync(this.#engine, this.#scene.activeCamera, {
      width: canvasEl.clientWidth,
      height: canvasEl.clientHeight,
    });

    this.adt.executeOnAllControls((control) => (control.isVisible = !control.isVisible));
    await this.changePixelDensity(1);

    let blob = await (await fetch(base64)).blob();
    Tools.Download(blob, "3d-garden-screenshot-" + Date.now());
  }

  public loopUpdateFpsLabel(): void {
    const fpsLabel = this.adt.getControlByName("fpsLabel");
    this.#scene.onBeforeRenderObservable.add(() => {
      fpsLabel.isVisible = options.showFps;

      if (fpsLabel.isVisible) {
        (fpsLabel as TextBlock).text = this.#scene.getEngine().getFps().toFixed();
      }
    });
  }
}
