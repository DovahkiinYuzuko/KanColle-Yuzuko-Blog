import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { visit } from 'unist-util-visit';

export function parseMarkdownToAst(markdownText) {
  const processor = unified().use(remarkParse);
  return processor.parse(markdownText);
}

function getHeadingText(headingNode) {
  let text = '';
  visit(headingNode, (node) => {
    if (node.type === 'text' || node.type === 'inlineCode') {
      text += node.value;
    }
  });
  return text.trim();
}

function getSectionId(depth, childIndex, title) {
  return `heading_${depth}_${childIndex}_${title.replace(/\s+/g, '_')}`;
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function extractSections(tree) {
  const sections = [];
  const children = tree.children;
  const headingIndices = [];

  for (let i = 0; i < children.length; i++) {
    if (children[i].type === 'heading') {
      headingIndices.push({
        index: i,
        depth: children[i].depth,
        title: getHeadingText(children[i])
      });
    }
  }

  for (let i = 0; i < headingIndices.length; i++) {
    const current = headingIndices[i];
    let endNodeIndex = children.length;

    for (let j = i + 1; j < headingIndices.length; j++) {
      if (headingIndices[j].depth <= current.depth) {
        endNodeIndex = headingIndices[j].index;
        break;
      }
    }

    const id = getSectionId(current.depth, current.index, current.title);

    sections.push({
      id,
      depth: current.depth,
      title: current.title,
      startNodeIndex: current.index,
      endNodeIndex,
      headingNode: children[current.index]
    });
  }

  return sections;
}

export function buildSectionTree(tree) {
  const root = {
    id: 'root',
    depth: 0,
    title: 'root',
    headingNode: null,
    bodyNodes: [],
    children: []
  };

  const stack = [root];

  for (let i = 0; i < tree.children.length; i++) {
    const node = tree.children[i];
    if (node.type === 'heading') {
      const title = getHeadingText(node);
      const id = getSectionId(node.depth, i, title);
      const sec = {
        id,
        depth: node.depth,
        title,
        headingNode: node,
        bodyNodes: [],
        children: []
      };

      while (stack.length > 1 && stack[stack.length - 1].depth >= node.depth) {
        stack.pop();
      }

      stack[stack.length - 1].children.push(sec);
      stack.push(sec);
    } else {
      stack[stack.length - 1].bodyNodes.push(node);
    }
  }

  return root;
}

function hasSelectedDescendants(section, selectedSet) {
  for (const child of section.children) {
    if (selectedSet.has(child.id) || hasSelectedDescendants(child, selectedSet)) {
      return true;
    }
  }
  return false;
}

function replaceTextInNode(node, variableMap) {
  if (!node || !variableMap || Object.keys(variableMap).length === 0) return;

  const staticPatterns = ['\\{[^{}\\r\\n]+\\}', '\\bEn(?=[^a-zA-Z0-9]|$)', '\\(n\\)', '第n艦隊'];
  const customKeys = Object.keys(variableMap)
    .filter(k => !['En', '(n)', '第n艦隊'].includes(k) && !k.startsWith('{'))
    .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  const allPatterns = [...staticPatterns, ...customKeys].filter(Boolean);
  const tokenRegex = new RegExp(allPatterns.join('|'), 'g');

  function replaceString(str) {
    if (typeof str !== 'string') return str;
    return str.replace(tokenRegex, (match) => {
      if (match === 'En') {
        return variableMap['En'] != null ? String(variableMap['En']) : match;
      }
      if (match in variableMap && variableMap[match] != null) {
        return String(variableMap[match]);
      }
      return match;
    });
  }

  visit(node, (child) => {
    if (child.value && typeof child.value === 'string') {
      child.value = replaceString(child.value);
    }
    if (child.url && typeof child.url === 'string') {
      child.url = replaceString(child.url);
    }
    if (child.alt && typeof child.alt === 'string') {
      child.alt = replaceString(child.alt);
    }
  });
}

function renderSectionTree(section, selectedSet, repeatConfigs, globalVariables, repeatVariables, parentVars = {}) {
  const resultNodes = [];

  const isSelfSelected = section.depth <= 1 || selectedSet.has(section.id);
  const isDescendantSelected = hasSelectedDescendants(section, selectedSet);

  // 自身も子孫も選択されていない場合はスキップ
  if (!isSelfSelected && !isDescendantSelected) {
    return resultNodes;
  }

  const repeatCount = (repeatConfigs && repeatConfigs[section.id]) || 1;

  for (let r = 0; r < repeatCount; r++) {
    const localVars = (repeatVariables && repeatVariables[section.id] && repeatVariables[section.id][r]) || {};
    const currentVars = { ...parentVars, ...globalVariables, ...localVars };

    if (section.headingNode) {
      const clonedHeading = deepClone(section.headingNode);
      replaceTextInNode(clonedHeading, currentVars);
      resultNodes.push(clonedHeading);
    }

    // 自身が選択されている場合は本文ノードも出力
    if (isSelfSelected) {
      for (const bodyNode of section.bodyNodes) {
        const clonedBody = deepClone(bodyNode);
        replaceTextInNode(clonedBody, currentVars);
        resultNodes.push(clonedBody);
      }
    }

    // 子セクションを再帰レンダリング
    for (const childSec of section.children) {
      const childRendered = renderSectionTree(
        childSec,
        selectedSet,
        repeatConfigs,
        globalVariables,
        repeatVariables,
        currentVars
      );
      resultNodes.push(...childRendered);
    }
  }

  return resultNodes;
}

export function generateMarkdown(rawMarkdown, selectedSectionIds, repeatConfigs, globalVariables, repeatVariables) {
  const tree = parseMarkdownToAst(rawMarkdown);
  const rootSection = buildSectionTree(tree);
  const selectedSet = new Set(selectedSectionIds);

  const renderedNodes = renderSectionTree(
    rootSection,
    selectedSet,
    repeatConfigs,
    globalVariables,
    repeatVariables
  );

  const newTree = {
    type: 'root',
    children: renderedNodes
  };

  const processor = unified().use(remarkStringify, {
    bullet: '-',
    emphasis: '*',
    strong: '*',
    fences: true,
    listItemIndent: 'one'
  });

  return processor.stringify(newTree);
}
