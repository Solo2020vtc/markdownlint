// @ts-check

import { addErrorContext } from "../helpers/helpers.cjs";
import { getReferenceLinkImageData, filterByTypesCached } from "./cache.mjs";

/**
 * Adds an error for a label space issue.
 *
 * @param {import("markdownlint").RuleOnError} onError Error-reporting callback.
 * @param {import("markdownlint").MicromarkToken} label Label token.
 * @param {import("markdownlint").MicromarkToken} labelText LabelText token.
 * @param {boolean} isStart True iff error is at the start of the link.
 */
function addLabelSpaceError(onError, label, labelText, isStart) {
  const match = labelText.text.match(isStart ? /^[^\S\r\n]+/ : /[^\S\r\n]+$/);
  const range = match ?
    [
      (isStart ? (labelText.startColumn) : (labelText.endColumn - match[0].length)),
      match[0].length
    ] :
    undefined;
  addErrorContext(
    onError,
    isStart ? (labelText.startLine + (match ? 0 : 1)) : (labelText.endLine - (match ? 0 : 1)),
    label.text.replace(/\s+/g, " "),
    isStart,
    !isStart,
    range,
    range ?
      {
        "editColumn": range[0],
        "deleteCount": range[1]
      } :
      undefined
  );
}

/**
 * Determines if a link is a valid link (and not a fake shortcut link due to parser tricks).
 *
 * @param {import("markdownlint").MicromarkToken} label Label token.
 * @param {import("markdownlint").MicromarkToken} labelText LabelText token.
 * @param {Map<string, any>} definitions Map of link definitions.
 * @returns {boolean} True iff the link is valid.
 */
function validLink(label, labelText, definitions) {
  return (label.parent?.children.length !== 1) || definitions.has(labelText.text.trim());
}

/** @type {import("markdownlint").Rule} */
export default {
  "names": [ "MD039", "no-space-in-links" ],
  "description": "Spaces inside link text",
  "tags": [ "whitespace", "links" ],
  "parser": "micromark",
  "function": function MD039(params, onError) {
    const { definitions } = getReferenceLinkImageData();
    const labels = filterByTypesCached([ "label" ])
      .filter((label) => label.parent?.type === "link");
    for (const label of labels) {
      const labelTexts = label.children.filter((child) => child.type === "labelText");
      for (const labelText of labelTexts) {
        if (
          (labelText.text.trimStart().length !== labelText.text.length) &&
          validLink(label, labelText, definitions)
        ) {
          addLabelSpaceError(onError, label, labelText, true);
        }
        if (
          (labelText.text.trimEnd().length !== labelText.text.length) &&
          validLink(label, labelText, definitions)
        ) {
          addLabelSpaceError(onError, label, labelText, false);
        }
      }
    }
  }
};
