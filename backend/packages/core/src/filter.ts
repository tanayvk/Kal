import {
  compileExpression,
  useDotAccessOperatorAndOptionalChaining,
} from "filtrex";

export function getFilter(exp: string) {
  return compileExpression(exp || "1", {
    customProp: useDotAccessOperatorAndOptionalChaining,
    extraFunctions: {
      strlen(s: string) {
        return s.length;
      },
      startswith(s: string, w: string) {
        return s.startsWith(w);
      },
      contains(a: string, b: string) {
        return a.includes(b);
      },
    },
  });
}
