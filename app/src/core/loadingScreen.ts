import { ILoadingScreen } from "@babylonjs/core/Loading/loadingScreen";
import { MenuUI } from "../app/menuUI";
import { Control } from "@babylonjs/gui/2D/controls/control";

export class CustomLoadingScreen implements ILoadingScreen {
  #menuUI: MenuUI;
  #loader: Control;
  // optional, but needed due to interface definitions
  public loadingUIBackgroundColor: string;
  public loadingUIText: string;

  constructor(menuUI: MenuUI) {
    this.#menuUI = menuUI;
    this.#loader = menuUI.adt.getControlByName("screenLoaderContainer");
  }

  public displayLoadingUI(): void {
    this.#menuUI.adt.getControlsByType("Button").forEach((b) => (b.isEnabled = false));
    this.#menuUI.adt.disablePicking = true;
    this.#loader.isVisible = true;
    this.#loader.alpha = 1;
  }

  public hideLoadingUI(): void {
    this.#menuUI.adt.disablePicking = false;
    this.#loader.isVisible = false;
    this.#loader.alpha = 1;
  }
}
