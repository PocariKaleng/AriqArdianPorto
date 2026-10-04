import type { LanguageFn } from 'highlight.js';
import python from 'highlight.js/lib/languages/python';

// Sage keeps Python syntax and adds its preparser notation.
const sage: LanguageFn = hljs => {
  const base = python(hljs);
  return {
    ...base,
    name: 'SageMath',
    aliases: ['sagemath'],
    contains: [
      { scope: 'meta', match: /^\s*(?:sage:|\.\.\.\.:)/ },
      { scope: 'built_in', match: /\b(?:GF|ZZ|QQ|RR|CC|CDF|RDF|SR|Integer|RealNumber|PolynomialRing|PowerSeriesRing|FractionField|Zmod|Integers|FiniteField|matrix|vector|var|factor|expand|solve|gcd|lcm|inverse_mod|power_mod|is_prime|next_prime|random_prime)\b/ },
      { scope: 'symbol', match: /\.<\s*[A-Za-z_]\w*(?:\s*,\s*[A-Za-z_]\w*)*\s*>/ },
      { scope: 'operator', match: /\^\^?|\*\*|\/\/|[+*/%=<>-]/, relevance: 0 },
      ...(base.contains || []),
    ],
  };
};

export default sage;
