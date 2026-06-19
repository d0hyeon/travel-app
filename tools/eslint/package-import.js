import fs from 'node:fs';
import path from 'node:path';
import { minimatch } from 'minimatch';
import { parser } from 'typescript-eslint';

//
// -----------------------------
// @package directive
// -----------------------------
//
// JSDoc `@package` 태그를 가진 export만 패키지 경계 검사 대상이다.
// 글롭 스코프: `@package { *.api.ts, hooks/** }` 처럼 콤마로 구분한
// 여러 패턴을 허용한다. 패턴은 "import 하는 쪽(importer)"의
// 패키지 루트 기준 상대경로에 대해 매칭한다.
//

const PACKAGE_TAG_REGEX = /@package(?:\s*\{([^}]*)\})?/;

function parsePackageDirective(jsdocText) {
  const match = jsdocText.match(PACKAGE_TAG_REGEX);
  if (!match) return null;

  const raw = match[1]?.trim();
  const patterns = raw
    ? raw
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)
    : [];

  return { patterns };
}

//
// -----------------------------
// utils
// -----------------------------
//

function normalize(p) {
  return path.normalize(p).replaceAll('\\', '/');
}

//
// -----------------------------
// import resolver
// -----------------------------
//

const RESOLVE_EXTS = [
  '',
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '/index.ts',
  '/index.tsx',
  '/index.js',
  '/index.jsx',
];

function resolveImport(importPath, importerFile) {
  const base = path.resolve(path.dirname(importerFile), importPath);

  for (const ext of RESOLVE_EXTS) {
    const candidate = `${base}${ext}`;
    if (isFile(candidate)) return candidate;
  }

  return null;
}

function isFile(p) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

//
// -----------------------------
// exported symbol directives (AST + 캐시)
// -----------------------------
//
// target 파일을 직접 파싱해 export된 심볼별로 @package directive를
// 추출한다. function/const/class 뿐 아니라 interface/type/enum,
// re-export(export { x })까지 처리한다. 매 import마다 재파싱하지
// 않도록 mtime 기반으로 캐시한다.
//

const directiveCache = new Map();

function getSymbolDirectives(filePath) {
  let mtimeMs;
  try {
    mtimeMs = fs.statSync(filePath).mtimeMs;
  } catch {
    return new Map();
  }

  const cached = directiveCache.get(filePath);
  if (cached && cached.mtimeMs === mtimeMs) {
    return cached.directives;
  }

  const directives = buildSymbolDirectives(filePath);
  directiveCache.set(filePath, { mtimeMs, directives });
  return directives;
}

function buildSymbolDirectives(filePath) {
  const directives = new Map();

  let source;
  try {
    source = fs.readFileSync(filePath, 'utf8');
  } catch {
    return directives;
  }

  let ast;
  let comments;
  try {
    const result = parser.parseForESLint(source, {
      comment: true,
      loc: true,
      range: true,
    });
    ast = result.ast;
    comments = result.ast.comments ?? [];
  } catch {
    return directives;
  }

  let prevEnd = 0;
  for (const node of ast.body) {
    collectExportNames(node, prevEnd, comments, directives);
    prevEnd = node.range[1];
  }

  return directives;
}

function collectExportNames(node, prevEnd, comments, directives) {
  if (node.type !== 'ExportNamedDeclaration') return;

  const directive = leadingPackageDirective(node, prevEnd, comments);
  if (!directive) return;

  for (const name of exportedNames(node)) {
    directives.set(name, directive);
  }
}

function exportedNames(node) {
  const names = [];
  const decl = node.declaration;

  if (decl) {
    // export function/const/class/interface/type/enum ...
    if (decl.id?.name) {
      names.push(decl.id.name);
    }
    if (decl.declarations) {
      // export const a = ..., b = ...
      for (const d of decl.declarations) {
        if (d.id?.name) names.push(d.id.name);
      }
    }
  } else if (node.specifiers) {
    // export { a, b as c }
    for (const spec of node.specifiers) {
      if (spec.exported?.name) names.push(spec.exported.name);
    }
  }

  return names;
}

function leadingPackageDirective(node, prevEnd, comments) {
  // 직전 선언과 현재 선언 사이의 블록 주석 중 가장 가까운 것만 본다.
  // (다른 선언에 붙은 주석이 흘러내려와 오매칭되는 것을 막는다.)
  let nearest = null;
  for (const comment of comments) {
    if (comment.type !== 'Block') continue;
    if (comment.range[0] < prevEnd) continue;
    if (comment.range[1] > node.range[0]) continue;
    if (!nearest || comment.range[1] > nearest.range[1]) {
      nearest = comment;
    }
  }

  if (!nearest) return null;
  return parsePackageDirective(nearest.value);
}

//
// -----------------------------
// package boundary
// -----------------------------
//
// 패키지 = @package 선언 파일이 속한 디렉토리. 그 디렉토리 트리
// 안의 파일만 해당 심볼을 import할 수 있다.
//

function getPackageRoot(declaringFile) {
  return normalize(path.dirname(declaringFile));
}

function isInsidePackage(importerFile, packageRoot) {
  const rel = relativeToPackage(importerFile, packageRoot);
  return !rel.startsWith('../') && rel !== '..';
}

function relativeToPackage(importerFile, packageRoot) {
  return normalize(path.relative(packageRoot, importerFile));
}

function matchesAnyPattern(relativePath, patterns) {
  return patterns.some((pattern) =>
    minimatch(relativePath, pattern, { dot: true }),
  );
}

//
// -----------------------------
// eslint rule
// -----------------------------
//

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        '@package로 선언된 export는 같은 패키지(선언 파일의 디렉토리) 안에서만 import할 수 있다',
    },
    schema: [],
    messages: {
      outsidePackage:
        "'{{symbol}}'은(는) @package로 선언되어 패키지 외부에서 import할 수 없습니다.",
      outsideScope:
        "'{{symbol}}'은(는) @package {{patterns}} 스코프에서만 import할 수 있습니다.",
    },
  },

  create(context) {
    const importerFile = normalize(
      context.physicalFilename ?? context.filename,
    );

    return {
      ImportDeclaration(node) {
        const importSource = node.source.value;
        if (typeof importSource !== 'string' || !importSource.startsWith('.')) {
          return;
        }

        const targetFile = resolveImport(importSource, importerFile);
        if (!targetFile) return;

        const directives = getSymbolDirectives(targetFile);
        if (directives.size === 0) return;

        const packageRoot = getPackageRoot(targetFile);

        for (const spec of node.specifiers) {
          if (spec.type !== 'ImportSpecifier') continue;

          const symbol = spec.imported.name;
          const directive = directives.get(symbol);
          if (!directive) continue;

          if (!isInsidePackage(importerFile, packageRoot)) {
            context.report({
              node: spec,
              messageId: 'outsidePackage',
              data: { symbol },
            });
            continue;
          }

          if (directive.patterns.length === 0) continue;

          const rel = relativeToPackage(importerFile, packageRoot);
          if (!matchesAnyPattern(rel, directive.patterns)) {
            context.report({
              node: spec,
              messageId: 'outsideScope',
              data: {
                symbol,
                patterns: directive.patterns.join(', '),
              },
            });
          }
        }
      },
    };
  },
};
