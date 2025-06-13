// @ts-ignore
import { registerSW } from "virtual:pwa-register";

export function initPWA(app: Element) {
  const pwaToast = app.querySelector<HTMLDivElement>("#pwa-toast")!;
  const pwaToastMessage = pwaToast.querySelector<HTMLDivElement>(".message #toast-message")!;
  const pwaCloseBtn = pwaToast.querySelector<HTMLButtonElement>("#pwa-close")!;
  const pwaRefreshBtn = pwaToast.querySelector<HTMLButtonElement>("#pwa-refresh")!;

  let refreshSW: (reloadPage?: boolean) => Promise<void> | undefined;

  const refreshCallback = () => {
    hidePwaToast(false);

    if (refreshSW) {
      refreshSW(true);
    } else {
      location.reload();
    }
  };

  function hidePwaToast(raf: boolean) {
    if (raf) {
      requestAnimationFrame(() => hidePwaToast(false));
      return;
    }
    if (pwaToast.classList.contains("refresh")) {
      pwaRefreshBtn.removeEventListener("click", refreshCallback);
    }

    pwaToast.classList.remove("show", "refresh");
  }

  function showPwaToast(offline: boolean) {
    if (!offline) {
      pwaRefreshBtn.addEventListener("click", refreshCallback);
    }

    requestAnimationFrame(() => {
      hidePwaToast(false);
      if (!offline) {
        pwaToast.classList.add("refresh");
      }
      pwaToast.classList.add("show");
    });
  }

  window.addEventListener("load", () => {
    pwaCloseBtn.addEventListener("click", () => hidePwaToast(true));
    refreshSW = registerSW({
      immediate: true,
      onOfflineReady() {
        pwaToastMessage.innerHTML = "App ready to work offline";
        showPwaToast(true);
      },
      onNeedRefresh() {
        pwaToastMessage.innerHTML = "New content available, click on reload button to update";
        showPwaToast(false);
      },
    });
  });
}
