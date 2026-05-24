/**
 * Markdown Processing Web Worker
 *
 * Offloads expensive markdown parsing to prevent main thread blocking.
 * Extracts code blocks, detects languages, and pre-processes structure.
 *
 * Flow: stream completes → content sent here → processed result returned
 */

// Code block extraction regex
const CODE_BLOCK_RE = /```(\w*)\n([\s\S]*?)```/g;
const INLINE_CODE_RE = /`([^`]+)`/g;

/**
 * Detect language from code content heuristics when not specified.
 */
function detectLanguage(code) {
  const trimmed = code.trim();
  if (/^import\s|^from\s.*import|^def\s|^class\s.*:/.test(trimmed)) return "python";
  if (/^(const|let|var|function|import|export)\s|=>\s*{/.test(trimmed)) return "javascript";
  if (/^(interface|type|enum)\s|:\s*(string|number|boolean)/.test(trimmed)) return "typescript";
  if (/^<[a-zA-Z][\s\S]*>/.test(trimmed) && /<\/[a-zA-Z]+>/.test(trimmed)) return "html";
  if (/^\{[\s\S]*\}$/.test(trimmed) || /^\[[\s\S]*\]$/.test(trimmed)) {
    try { JSON.parse(trimmed); return "json"; } catch { /* not json */ }
  }
  if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER)\s/i.test(trimmed)) return "sql";
  if (/^#!\s*\//.test(trimmed) || /^\s*(if|then|fi|echo|export)\s/.test(trimmed)) return "bash";
  if (/^(package|func|import\s*\(|type\s+\w+\s+struct)/.test(trimmed)) return "go";
  if (/^(use\s|fn\s|let\s+mut|impl\s|pub\s)/.test(trimmed)) return "rust";
  return "";
}

/**
 * Extract and process code blocks from markdown content.
 */
function extractCodeBlocks(content) {
  const blocks = [];
  let match;
  const regex = new RegExp(CODE_BLOCK_RE.source, "g");

  while ((match = regex.exec(content)) !== null) {
    const lang = match[1] || detectLanguage(match[2]);
    blocks.push({
      language: lang,
      code: match[2],
      start: match.index,
      end: match.index + match[0].length,
      lineCount: match[2].split("\n").length,
    });
  }

  return blocks;
}

/**
 * Compute structural metadata for the markdown content.
 */
function computeStructure(content) {
  const lines = content.split("\n");
  let headings = 0;
  let lists = 0;
  let paragraphs = 0;
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    if (/^#{1,6}\s/.test(line)) headings++;
    else if (/^\s*[-*+]\s|^\s*\d+\.\s/.test(line)) lists++;
    else if (line.trim().length > 0) paragraphs++;
  }

  return { headings, lists, paragraphs, totalLines: lines.length };
}

/**
 * Main message handler
 */
self.onmessage = function (event) {
  const { id, content } = event.data;

  if (!content) {
    self.postMessage({ id, processed: content, status: "success" });
    return;
  }

  try {
    const codeBlocks = extractCodeBlocks(content);
    const structure = computeStructure(content);
    const inlineCodeCount = (content.match(INLINE_CODE_RE) || []).length;

    self.postMessage({
      id,
      processed: content,
      metadata: {
        codeBlocks,
        structure,
        inlineCodeCount,
        contentLength: content.length,
        hasLargeCodeBlock: codeBlocks.some((b) => b.lineCount > 50),
      },
      status: "success",
    });
  } catch (error) {
    self.postMessage({
      id,
      processed: content,
      status: "error",
      error: error.message,
    });
  }
};
