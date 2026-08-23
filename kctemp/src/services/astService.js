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

function replaceTextInNode(node, variableMap) {
  if (!node || !variableMap) return;

  function replaceString(str) {
    if (typeof str !== 'string') return str;
    let result = str;
    for (const [key, value] of Object.entries(variableMap)) {
      if (!value) continue;
      if (key === 'En') {
        result = result.replace(/\bEn\b/g, value).replace(/En\{/g, `${value}{`).replace(/En(?=[^a-zA-Z0-9]|$)/g, value);
      } else if (key === '(n)') {
        result = result.replaceAll('(n)', value);
      } else if (key === '第n艦隊') {
        result = result.replaceAll('第n艦隊', value);
      } else {
        result = result.replaceAll(key, value);
      }
    }
    return result;
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

  // H1以外で選択されていないセクションは除外
  if (section.depth > 1 && !selectedSet.has(section.id)) {
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

    for (const bodyNode of section.bodyNodes) {
      const clonedBody = deepClone(bodyNode);
      replaceTextInNode(clonedBody, currentVars);
      resultNodes.push(clonedBody);
    }

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
