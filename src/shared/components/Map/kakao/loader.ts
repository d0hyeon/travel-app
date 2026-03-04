
let isLoaded = false;
let promise: Promise<void> | null = null;

export function loadKakaoMap() {
  if (promise == null) {
    promise = new Promise((resolve) => {
      window.kakao.maps.load(() => {
        isLoaded = true;
        resolve()
      })
    })
  }

  return promise;
}

export function isKakaoMapLoaded(): boolean {
  return isLoaded
}
