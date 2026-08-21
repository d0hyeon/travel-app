/**
 * 마지막으로 읽은 시각을 담아두는 저장소.
 *
 * 읽기가 동기인 이유는 미읽음 개수가 렌더 중에 계산되기 때문이다.
 * 웹은 localStorage 가 그대로 맞고, 앱은 AsyncStorage 를 메모리 캐시로 감싸
 * 같은 모양을 만든다 — 쓰기는 비동기로 흘려보내면 된다.
 */
export interface LastReadStore {
  get: (key: string) => string | null;
  set: (key: string, value: string) => void;
}

const memoryStore = new Map<string, string>();

let store: LastReadStore = {
  get: (key) => memoryStore.get(key) ?? null,
  set: (key, value) => void memoryStore.set(key, value),
};

/** 앱 시작 시 플랫폼 저장소를 한 번 꽂는다. */
export function setLastReadStore(next: LastReadStore) {
  store = next;
}

export function getLastReadStore(): LastReadStore {
  return store;
}
