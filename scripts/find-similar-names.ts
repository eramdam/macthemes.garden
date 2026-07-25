import { CmpStr } from "cmpstr";
import { groupBy } from "es-toolkit";
import { themeAuthorsLoader } from "../src/themesLoader";

const cmp = new CmpStr();
cmp.rmvAlgo("soundex");
cmp.rmvAlgo("cosine");
console.log(cmp.getFlags());
const algos = cmp.listAlgo();

function areStringsSimilar(stringA: string, stringB: string) {
  const results = algos
    .map((algo) => {
      try {
        if (algo === "hamming" && stringA.length !== stringB.length) {
          return undefined;
        }

        return [algo, cmp.compare(algo, stringA, stringB, {})];
      } catch (e) {
        return undefined;
      }
    })
    .filter((r) => !!r);

  const average =
    results.map((p) => p[1]).reduce((a, b) => a + b) / results.length;

  // console.log({ stringA, stringB, results, average });

  return average > 0.7;
}

(async () => {
  const authors = await themeAuthorsLoader();
  const authorsNames = authors.map((a) => a.name);

  const grouped = Object.fromEntries(
    Object.entries(
      groupBy(authorsNames, (author) => {
        return (
          authorsNames.find((other) => {
            if (
              other === author ||
              other.toLowerCase() === author.toLowerCase()
            ) {
              return true;
            }
            return areStringsSimilar(other, author);
          }) || ""
        );
      }),
    ).filter(([, key]) => key.length > 1),
  );

  console.log(grouped);
})();
