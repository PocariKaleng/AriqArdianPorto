import { createLowlight } from 'lowlight';
import python from 'highlight.js/lib/languages/python';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import sql from 'highlight.js/lib/languages/sql';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import cpp from 'highlight.js/lib/languages/cpp';
import java from 'highlight.js/lib/languages/java';
import solidity from 'highlightjs-solidity';

export const codeLanguages = [
  ['plaintext', 'Plain text'], ['python', 'Python'], ['solidity', 'Solidity'],
  ['javascript', 'JavaScript'], ['typescript', 'TypeScript'], ['bash', 'Bash'],
  ['json', 'JSON'], ['sql', 'SQL'], ['xml', 'HTML'], ['css', 'CSS'], ['cpp', 'C / C++'], ['java', 'Java'],
] as const;
export const syntax = createLowlight({ python, javascript, typescript, bash, json, sql, xml, css, cpp, java });
syntax.register('solidity', solidity.solidity);
syntax.registerAlias('solidity', ['sol']);
export function codeLanguage(label: string) {
  return codeLanguages.find(([value]) => value === label)?.[1] || (label === 'sol' ? 'Solidity' : label || 'Plain text');
}
