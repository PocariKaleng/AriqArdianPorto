declare module 'highlightjs-solidity' {
  import type { LanguageFn, HLJSApi } from 'highlight.js';
  const register: ((highlight: HLJSApi) => void) & { solidity: LanguageFn; yul: LanguageFn };
  export default register;
}
