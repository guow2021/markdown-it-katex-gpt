import katex, { StrictFunction } from 'katex';

// Define reusable types
type Delimiter = {
  left: string;
  right: string;
  display: boolean;
};

type KatexOptions = {
  delimiters: Delimiter[];
  strict?: boolean | 'ignore' | 'warn' | 'error' | StrictFunction;
};

type MarkdownState = any; // Replace with a more specific type if available
type MarkdownInlineRuler = {
  after: (arg0: string, arg1: string, arg2: (state: MarkdownState, silent: boolean) => boolean) => void;
};

type MarkdownInline = {
  ruler: MarkdownInlineRuler;
};

type MarkdownParser = {
  inline: MarkdownInline;
};

// Default options
const defaultOptions: KatexOptions = {
  delimiters: [
    { left: '\\[', right: '\\]', display: true }, // Display mode for block equations
    { left: '\\(', right: '\\)', display: false }, // Inline mode for inline equations
  ],
  strict: 'ignore', // Add the default strict parameter
};

// Rule function to handle escaped brackets
function escapedBracketRule(options: KatexOptions) {
  return (state: MarkdownState, silent: boolean) => {
    const max: number = state.posMax;
    const start: number = state.pos;

    for (const { left, right, display } of options.delimiters) {
      // Check if the text starts with the left delimiter
      if (!state.src.slice(start).startsWith(left)) continue;

      // Skip the length of the left delimiter
      let pos: number = start + left.length;

      // Find the matching right delimiter
      while (pos < max) {
        if (state.src.slice(pos).startsWith(right)) {
          break;
        }
        pos++;
      }

      // If no matching right delimiter is found, skip and continue to the next match
      if (pos >= max) continue;

      // If not in silent mode, convert the LaTeX formula to MathML
      if (!silent) {
        const content: string = state.src.slice(start + left.length, pos);
        try {
          const renderedContent: string = katex.renderToString(content, {
            throwOnError: false,
            output: 'mathml',
            displayMode: display,
            strict: options.strict, // Pass the strict parameter
          });
          const token: any = state.push('html_inline', '', 0);
          token.content = renderedContent;
        } catch (e) {
          console.error(e);
        }
      }

      // Update the position, skipping the length of the right delimiter
      state.pos = pos + right.length;
      return true;
    }
  };
}

// Plugin function to add the rule to the markdown parser
export default function (md: MarkdownParser, options: KatexOptions = defaultOptions) {
  md.inline.ruler.after('text', 'escaped_bracket', escapedBracketRule(options));
}
