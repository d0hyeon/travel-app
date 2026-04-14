function isHtmlElement(node: EventTarget): node is HTMLElement {
  return node instanceof HTMLElement;
}

function isNode(node: EventTarget): node is Node {
  return node instanceof Node && !isHtmlElement(node);
}


// 입력창 및 폼 요소 (포커스 및 텍스트 선택 보장)
const DISABLED_TAG_NAMES = ['INPUT', 'TEXTAREA', 'SELECT', 'OPTION'];
/**
 * 해당 노드가 터치 이벤트를 독점해야 하는 요소인지 판별
 * @param target - event.target
 * @returns true면 시트 드래그를 중단해야 함
 */
export function shouldPreventSheetDrag(target: EventTarget): boolean {
  let current: EventTarget | null = target;

  if (document.activeElement && DISABLED_TAG_NAMES.includes(document.activeElement.tagName)) {
    return true;
  }

  while (current) {
    if (isNode(current)) {
      current = current.parentElement;
      continue;
    }
    if (!isHtmlElement(current)) {
      return false;
    }

    const isScrollable = current.hasAttribute('[data-scrollable]');
    if (isScrollable) return true;

    
    const isInput = DISABLED_TAG_NAMES.includes(current.tagName);
    const isContentEditable = current.isContentEditable;

    // 개발자가 명시한 스크롤 가능 영역 또는 지도 등 외부 라이브러리
    const hasScrollAttribute =
      current.dataset.scrollable === 'true' ||
      current.dataset.preventSheet === 'true';

    if (isInput || isContentEditable || hasScrollAttribute) {
      return true;
    }

    current = current.parentElement;
  }

  return false;
}
