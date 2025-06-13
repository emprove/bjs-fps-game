import { RequestFullscreen } from "@babylonjs/core/Engines/engine.common";

export function createPwaToast(appEl: HTMLDivElement): HTMLDivElement {
  const toast = document.createElement("div");
  toast.id = "pwa-toast";
  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-labelledby", "toast-message");
  toast.innerHTML = `
    <div class="message"><span id="toast-message"></span></div>
    <div class="buttons">
      <button id="pwa-refresh" type="button">Reload</button>
      <button id="pwa-close" type="button">Close</button>
    </div>`;
  appEl.appendChild(toast);

  return toast;
}

export function createLoader(appEl: HTMLDivElement, iconUrl: string): HTMLDivElement {
  const loader = document.createElement("div");
  loader.id = "loader";
  loader.style.display = "flex";
  loader.innerHTML = `
    <div class="loader__logo-wrapper">
      <img src="${iconUrl}" alt="logo" width="192" class="loader__logo" />
      <div class="loader__spinner"></div>
    </div>
    <div class="loader__body">
      <div class="loader__start"><span>Tap to start</span></div>
      <div class="loader__tips"><span>Headphones recommended</span></div>
    </div>`;
  appEl.appendChild(loader);

  return loader;
}

export async function initLoadingScreenLogic(
  appEl: HTMLDivElement,
  isFullscreen: boolean,
): Promise<boolean> {
  const loader = document.getElementById("loader") as HTMLDivElement;

  return new Promise((resolve) => {
    loader.addEventListener("click", () => {
      if (isFullscreen) {
        RequestFullscreen(appEl);
      }
      loader.style.opacity = "0";
      setTimeout(() => (loader.style.display = "none"), 500);
      resolve(true);
    });
  });
}

export const loadingScreenReadyToStart = (): void => {
  const loaderSpinner = document.getElementsByClassName("loader__spinner")[0] as HTMLElement;
  const loaderBody = document.getElementsByClassName("loader__body")[0] as HTMLElement;
  loaderSpinner.style.display = "none";
  loaderBody.style.display = "flex";
};
