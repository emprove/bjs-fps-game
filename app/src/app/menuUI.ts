import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { Control } from "@babylonjs/gui/2D/controls/control";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { Container } from "@babylonjs/gui/2D/controls/container";
import { Slider } from "@babylonjs/gui/2D/controls/sliders/slider";
import { Checkbox } from "@babylonjs/gui/2D/controls/checkbox";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { ScrollViewer } from "@babylonjs/gui/2D/controls/scrollViewers/scrollViewer";
import { Grid } from "@babylonjs/gui/2D/controls/grid";
import { Image } from "@babylonjs/gui/2D/controls/image";
import { AudioEngineV2 } from "@babylonjs/core/AudioV2/abstractAudio/audioEngineV2";
import { ExitFullscreen, RequestFullscreen } from "@babylonjs/core/Engines/engine.common";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import type { Scene } from "@babylonjs/core/scene";
// app
import { appEl } from "../core/main";
import { PLAYABLE_SCENES } from "../core/utils";
import { emitter } from "../lib/emitter";
import { options } from "../core/options";
import { lang } from "../lang";
import { device } from "../lib/deviceDetection";
// assets
import bgRdnImg from "../assets/textures/bg_rdn.jpg";

export class MenuUI {
  #audioEngine: AudioEngineV2;
  #maxContainerWidthInPx: number;
  public adt: AdvancedDynamicTexture;

  constructor(scene: Scene, audioEngine: AudioEngineV2) {
    this.#audioEngine = audioEngine;

    const imageAspectRatio = 1920 / 1200;
    const deviceAspectRatio = window.screen.width / window.screen.availHeight;
    const deviceAspectCorrection = deviceAspectRatio / imageAspectRatio;
    const fullscreenAspectCorrection = 1.1;

    let width, height: number;
    if (deviceAspectRatio >= 1) {
      // landscape
      width = 16 * deviceAspectCorrection * fullscreenAspectCorrection;
      height = 10 * deviceAspectCorrection * fullscreenAspectCorrection;
    } else {
      // portrait
      width = (16 / deviceAspectCorrection) * fullscreenAspectCorrection;
      height = (10 / deviceAspectCorrection) * fullscreenAspectCorrection;
    }

    const bgPlane = MeshBuilder.CreatePlane("bgPlane", {
      width: width,
      height: height,
    });
    bgPlane.scaling.y *= -1;
    bgPlane.billboardMode = AbstractMesh.BILLBOARDMODE_ALL;

    const bgPlaneMaterial = new StandardMaterial("bgPlaneMaterial", scene);
    const imageTexture = new Texture(
      bgRdnImg,
      scene,
      false,
      false,
      Texture.TRILINEAR_SAMPLINGMODE,
      () => {
        bgPlaneMaterial.diffuseTexture = imageTexture;
        bgPlaneMaterial.emissiveTexture = imageTexture;
        bgPlaneMaterial.emissiveColor = new Color3(1, 1, 1);
        bgPlaneMaterial.disableLighting = true;
        bgPlaneMaterial.specularColor = Color3.Black();
        bgPlane.material = bgPlaneMaterial;
      },
    );

    this.adt = AdvancedDynamicTexture.CreateFullscreenUI("menuUI", true, scene);
    this.adt.useSmallestIdeal = true;

    this.adaptiveStack();
    window.addEventListener("resize", () => {
      this.adaptiveStack();
    });
    window.addEventListener("orientationchange", () => {
      this.adaptiveStack();
    });
  }

  private adaptiveStack() {
    this.adt.idealWidth = window.screen.width;
    this.adt.idealHeight = window.screen.availHeight;
    this.setMaxContainerWidth();
  }

  private setMaxContainerWidth() {
    const isLandscapeMode = window.screen.availWidth > window.screen.availHeight;
    if (device.isMobile) {
      this.#maxContainerWidthInPx = isLandscapeMode ? 320 : window.screen.availWidth - 80;
    } else {
      this.#maxContainerWidthInPx = window.screen.availWidth > 720 ? 480 : 320;
    }
  }

  public init() {
    const defaultCornerRadius = 30;
    const defaultBtnThickness = 3;
    const defaultBtnFontSize = 20;
    const playableSceneBtnHeight = this.#maxContainerWidthInPx / 1.77777;
    const btnHeightInPx = 40;

    /**
     * Main menu
     */
    const menuContainer = new Container("menuContainer");
    menuContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    menuContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    menuContainer.height = "100%";
    this.adt.addControl(menuContainer);

    const mainMenuPanel = new StackPanel("mainMenuPanel");
    mainMenuPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    mainMenuPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    mainMenuPanel.spacing = 20;
    menuContainer.addControl(mainMenuPanel);

    const logo = new Image("logo", import.meta.env.VITE_PWA_ICON_192);
    logo.width = "160px";
    logo.height = "160px";
    logo.stretch = Image.STRETCH_UNIFORM;
    logo.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    logo.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

    mainMenuPanel.addControl(logo);

    const resumeBut = Button.CreateSimpleButton("resumeBut", lang.screens.mainMenu.resumeBut);
    resumeBut.isVisible = false;
    resumeBut.width = this.#maxContainerWidthInPx + "px";
    resumeBut.height = btnHeightInPx + "px";
    resumeBut.color = "black";
    resumeBut.background = "white";
    resumeBut.cornerRadius = defaultCornerRadius;
    resumeBut.fontWeight = "normal";
    resumeBut.fontSize = defaultBtnFontSize;
    resumeBut.thickness = defaultBtnThickness;
    resumeBut.onPointerClickObservable.add(() => {
      emitter.emit("resume-playable-scene");
    });

    mainMenuPanel.addControl(resumeBut);

    const startBut = Button.CreateSimpleButton("startBut", lang.screens.mainMenu.startBut);
    startBut.width = this.#maxContainerWidthInPx + "px";
    startBut.height = btnHeightInPx + "px";
    startBut.color = "black";
    startBut.background = "white";
    startBut.cornerRadius = defaultCornerRadius;
    startBut.fontWeight = "normal";
    startBut.fontSize = defaultBtnFontSize;
    startBut.thickness = defaultBtnThickness;
    startBut.onPointerClickObservable.add(() => {
      if (PLAYABLE_SCENES.length === 1) {
        console.log("async emit load-scene");
        emitter.emit("load-scene", PLAYABLE_SCENES[0].name);
      } else {
        mainMenuPanel.isVisible = false;
        startMenuPanel.isVisible = true;
      }
    });

    mainMenuPanel.addControl(startBut);

    const optionsBut = Button.CreateSimpleButton("optionsBut", lang.screens.mainMenu.optionsBut);
    optionsBut.width = this.#maxContainerWidthInPx + "px";
    optionsBut.height = btnHeightInPx + "px";
    optionsBut.color = "black";
    optionsBut.background = "white";
    optionsBut.cornerRadius = defaultCornerRadius;
    optionsBut.fontWeight = "normal";
    optionsBut.fontSize = defaultBtnFontSize;
    optionsBut.thickness = defaultBtnThickness;
    optionsBut.onPointerClickObservable.add(() => {
      settingsPanel.isVisible = true;
      mainMenuPanel.isVisible = false;
    });

    mainMenuPanel.addControl(optionsBut);

    /**
     * Start menu
     */
    const startMenuPanel = new StackPanel("startMenuPanel");
    startMenuPanel.isVisible = false;

    menuContainer.addControl(startMenuPanel);

    const startMenuPanelHeader = new TextBlock(
      "startMenuPanelHeader",
      lang.screens.mainMenu.startMenuPanelHeader,
    );
    startMenuPanelHeader.width = this.#maxContainerWidthInPx + "px";
    startMenuPanelHeader.height = "30px";
    startMenuPanelHeader.color = "white";
    startMenuPanelHeader.fontSize = 30;
    startMenuPanelHeader.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;

    startMenuPanel.addControl(startMenuPanelHeader);

    if (PLAYABLE_SCENES.length > 1) {
      const selectSceneText = new TextBlock(
        "selectSceneText",
        lang.screens.mainMenu.selectSceneText,
      );
      selectSceneText.height = "80px";
      selectSceneText.color = "white";
      selectSceneText.fontWeight = "normal";
      selectSceneText.fontSize = 18;

      startMenuPanel.addControl(selectSceneText);
    }

    const playableScenesScrollViewer = new ScrollViewer("playableScenesScrollViewer");
    playableScenesScrollViewer.width = this.#maxContainerWidthInPx + 50 + "px";
    playableScenesScrollViewer.height = playableSceneBtnHeight + 20 + "px";
    playableScenesScrollViewer.thickness = 0;
    playableScenesScrollViewer.barColor = "green";

    startMenuPanel.addControl(playableScenesScrollViewer);

    const playableScenesGrid = new Grid("playableScenesGrid");
    playableScenesGrid.height = PLAYABLE_SCENES.length * playableSceneBtnHeight + 20 + "px";
    playableScenesGrid.addColumnDefinition(1);

    playableScenesScrollViewer.addControl(playableScenesGrid);

    for (let i = 0; i < PLAYABLE_SCENES.length; i++) {
      let btn = Button.CreateImageWithCenterTextButton(
        PLAYABLE_SCENES[i].previewName + "SceneBtn",
        PLAYABLE_SCENES[i].previewName,
        PLAYABLE_SCENES[i].preview,
      );

      btn.onPointerClickObservable.add(() => {
        console.log("playable scene button triggered");
        emitter.emit("load-scene", PLAYABLE_SCENES[i].name);
      });

      btn.width = this.#maxContainerWidthInPx + "px";
      btn.height = this.#maxContainerWidthInPx / 1.77777 + "px";
      btn.color = "black";
      btn.background = "white";
      btn.fontWeight = "normal";
      btn.fontSize = 18;
      btn.thickness = 0;
      btn.cornerRadius = defaultCornerRadius;

      playableScenesGrid.addRowDefinition(1);
      playableScenesGrid.addControl(btn, i, 0);
    }

    const startMenuBackBut = Button.CreateSimpleButton(
      "startMenuBackBut",
      lang.screens.mainMenu.startMenuBackBut,
    );
    startMenuBackBut.width = "200px";
    startMenuBackBut.height = btnHeightInPx + "px";
    startMenuBackBut.color = "white";
    startMenuBackBut.disabledColor = "white";
    startMenuBackBut.fontWeight = "normal";
    startMenuBackBut.fontSize = defaultBtnFontSize;
    startMenuBackBut.thickness = defaultBtnThickness;
    startMenuBackBut.cornerRadius = defaultCornerRadius;
    startMenuBackBut.paddingTop = "30px";
    startMenuBackBut.onPointerClickObservable.add(() => {
      startMenuPanel.isVisible = false;
      mainMenuPanel.isVisible = true;
    });

    startMenuPanel.addControl(startMenuBackBut);

    /**
     * Settings menu
     */
    const settingsPanel = new StackPanel("settingsPanel");
    settingsPanel.isVisible = false;
    settingsPanel.spacing = 30;

    menuContainer.addControl(settingsPanel);

    // volume
    const volumePanel = new StackPanel("volumePanel");
    settingsPanel.addControl(volumePanel);

    const volumeSliderHeader = new TextBlock(
      "volumeSliderHeader",
      lang.screens.mainMenu.volumeSliderHeader,
    );
    volumeSliderHeader.width = this.#maxContainerWidthInPx + "px";
    volumeSliderHeader.height = "30px";
    volumeSliderHeader.color = "white";
    volumeSliderHeader.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;

    volumePanel.addControl(volumeSliderHeader);

    const volumeSlider = new Slider("volumeSlider");
    volumeSlider.width = this.#maxContainerWidthInPx + "px";
    volumeSlider.minimum = 0;
    volumeSlider.maximum = 1;
    volumeSlider.value = options.volume;
    volumeSlider.height = "20px";
    volumeSlider.color = "white";
    volumeSlider.thumbColor = "green";
    volumeSlider.onValueChangedObservable.add((value) => {
      options.volume = Number(value.toFixed(2));
      this.#audioEngine.volume = options.volume;
    });

    volumePanel.addControl(volumeSlider);

    const lookAroundSensPanel = new StackPanel("lookAroundSensPanel");
    settingsPanel.addControl(lookAroundSensPanel);

    const lookAroundSensSliderHeader = new TextBlock(
      "lookAroundSensSliderHeader",
      lang.screens.mainMenu.lookAroundSensSliderHeader + ": " + options.lookAroundSens,
    );
    lookAroundSensSliderHeader.width = this.#maxContainerWidthInPx + "px";
    lookAroundSensSliderHeader.height = "30px";
    lookAroundSensSliderHeader.color = "white";
    lookAroundSensSliderHeader.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;

    lookAroundSensPanel.addControl(lookAroundSensSliderHeader);

    const lookAroundSensSlider = new Slider("lookAroundSensSlider");
    lookAroundSensSlider.width = this.#maxContainerWidthInPx + "px";
    lookAroundSensSlider.minimum = 0.1;
    lookAroundSensSlider.maximum = 2;
    lookAroundSensSlider.value = 1.0;
    lookAroundSensSlider.height = "20px";
    lookAroundSensSlider.thumbColor = "green";
    lookAroundSensSlider.color = "white";
    lookAroundSensSlider.onValueChangedObservable.add((value) => {
      options.lookAroundSens = Number(value.toFixed(2));
      lookAroundSensSliderHeader.text =
        lang.screens.mainMenu.lookAroundSensSliderHeader + ": " + options.lookAroundSens;
    });

    lookAroundSensPanel.addControl(lookAroundSensSlider);

    // fullscreenModePanel
    const fullscreenModePanel = new StackPanel("fullscreenModePanel");
    fullscreenModePanel.height = "20px";
    fullscreenModePanel.width = this.#maxContainerWidthInPx + "px";
    fullscreenModePanel.isVertical = false;
    fullscreenModePanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    settingsPanel.addControl(fullscreenModePanel);

    const fullscreenModeCheckbox = new Checkbox("fullscreenModeCheckbox");
    fullscreenModeCheckbox.width = "20px";
    fullscreenModeCheckbox.height = "20px";
    fullscreenModeCheckbox.isChecked = true;
    fullscreenModeCheckbox.color = "green";
    fullscreenModeCheckbox.onIsCheckedChangedObservable.add((value) => {
      options.fullscreen = value;

      if (!options.fullscreen) {
        ExitFullscreen();
      } else {
        RequestFullscreen(appEl);
      }
    });

    fullscreenModePanel.addControl(fullscreenModeCheckbox);

    const fullscreenModeCheckboxText = new TextBlock(
      "fullscreenModeCheckboxText",
      lang.screens.mainMenu.fullscreenModeCheckboxText,
    );
    fullscreenModeCheckboxText.width = this.#maxContainerWidthInPx - 20 + "px";
    fullscreenModeCheckboxText.paddingLeft = "10px";
    fullscreenModeCheckboxText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    fullscreenModeCheckboxText.color = "white";
    fullscreenModeCheckboxText.isPointerBlocker = true;
    fullscreenModeCheckboxText.onPointerDownObservable.add(() => {
      fullscreenModeCheckbox.isChecked = !fullscreenModeCheckbox.isChecked;
    });

    fullscreenModePanel.addControl(fullscreenModeCheckboxText);

    // showFpsPanel
    const showFpsPanel = new StackPanel("showFpsPanel");
    showFpsPanel.height = "20px";
    showFpsPanel.width = this.#maxContainerWidthInPx + "px";
    showFpsPanel.isVertical = false;
    showFpsPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

    settingsPanel.addControl(showFpsPanel);

    const showFpsCheckbox = new Checkbox("showFpsCheckbox");
    showFpsCheckbox.width = "20px";
    showFpsCheckbox.height = "20px";
    showFpsCheckbox.isChecked = options.showFps;
    showFpsCheckbox.color = "green";
    showFpsCheckbox.onIsCheckedChangedObservable.add(async (value) => {
      options.showFps = value;
    });

    showFpsPanel.addControl(showFpsCheckbox);

    const showFpsCheckboxText = new TextBlock(
      "showFpsCheckboxText",
      lang.screens.mainMenu.showFpsCheckboxText,
    );
    showFpsCheckboxText.width = this.#maxContainerWidthInPx - 20 + "px";
    showFpsCheckboxText.paddingLeft = "10px";
    showFpsCheckboxText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    showFpsCheckboxText.color = "white";
    showFpsCheckboxText.isPointerBlocker = true;
    showFpsCheckboxText.onPointerDownObservable.add(async () => {
      showFpsCheckbox.isChecked = !showFpsCheckbox.isChecked;
    });

    showFpsPanel.addControl(showFpsCheckboxText);

    // settingsMenuBackBut
    const settingsMenuBackBut = Button.CreateSimpleButton(
      "settingsMenuBackBut",
      lang.screens.mainMenu.settingsMenuBackBut,
    );
    settingsMenuBackBut.width = "200px";
    settingsMenuBackBut.height = btnHeightInPx + "px";
    settingsMenuBackBut.color = "black";
    settingsMenuBackBut.background = "white";
    settingsMenuBackBut.cornerRadius = defaultCornerRadius;
    settingsMenuBackBut.disabledColor = "gray";
    settingsMenuBackBut.fontWeight = "normal";
    settingsMenuBackBut.fontSize = defaultBtnFontSize;
    settingsMenuBackBut.thickness = defaultBtnThickness;
    settingsMenuBackBut.cornerRadius = defaultCornerRadius;
    settingsMenuBackBut.onPointerClickObservable.add(() => {
      settingsPanel.isVisible = false;
      mainMenuPanel.isVisible = true;
    });

    settingsPanel.addControl(settingsMenuBackBut);

    /**
     * Screen loader
     * To overlay all menu this container must be added last (no zIndex used)
     */
    const screenLoaderContainer = new Container("screenLoaderContainer");
    screenLoaderContainer.isVisible = false;
    screenLoaderContainer.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    screenLoaderContainer.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    screenLoaderContainer.height = "100%";
    screenLoaderContainer.background = "black";

    this.adt.addControl(screenLoaderContainer);

    const loadingText = new TextBlock("loadingText", lang.screens.mainMenu.loadingText);
    loadingText.color = "white";
    loadingText.fontSize = 24;

    screenLoaderContainer.addControl(loadingText);
  }
}
