import { orderBy, uniq } from "lodash-es";
import crypto from "node:crypto";
import slugify from "slugify";
import { getLikesForTheme } from "./helpers/dbHelpers";
import themesKaleidoscopeAirtable from "./themes/airtable.json" with { type: "json" };
import themesKaleidoscopeBot from "./themes/original.json" with { type: "json" };

export const customSlugify = (str: string) =>
  slugify(str, {
    remove: /[*+~.()'"!:@\/]/g,
    trim: true,
    strict: true,
  });

const archivesInAirtable = new Set(
  themesKaleidoscopeAirtable.map((t) => t.archiveFilename),
);
const archivesInBot = new Set(
  themesKaleidoscopeBot.map((t) => t.archiveFilename),
);
const botThemesNotOnAirtableYet = themesKaleidoscopeBot.filter((theme) => {
  return !archivesInAirtable.has(theme.archiveFilename);
});

export async function themesLoader() {
  const result = await Promise.all(
    themesKaleidoscopeAirtable
      .map((theme) => {
        const id = crypto
          .createHash("shake256", { outputLength: 6 })
          .update([theme.name, theme.authors, theme.archiveFilename].join("-"))
          .digest("hex");

        if (!theme.ksaSampler) {
          // console.log("!theme.ksaSampler", theme);
          return undefined;
        }
        return {
          id,
          name: theme.name,
          authors: makeAuthorsFromAuthorsString(theme.authors || ""),
          year: theme.year,
          thumbnails: [theme.ksaSampler, theme.about, theme.showcase].map((t) =>
            t.replace("public/", "/"),
          ),
          mainThumbnail: theme.ksaSampler.replace("public/", "/"),
          archiveFile: theme.archiveFilename,
          urlBase: customSlugify(`${id}-${theme.name}`),
          isAirtable: true,
          isNew: !archivesInBot.has(theme.archiveFilename),
          createdAt: new Date(theme.created),
        };
      })
      .filter((theme) => !!theme)
      .concat(
        botThemesNotOnAirtableYet.map((theme) => {
          const id = crypto
            .createHash("shake256", { outputLength: 6 })
            .update(
              [theme.name, theme.authors, theme.archiveFilename].join("-"),
            )
            .digest("hex");

          return {
            id,
            name: theme.name,
            year: "",
            authors: makeAuthorsFromAuthorsString(theme.authors || ""),
            archiveFile: theme.archiveFilename,
            thumbnails: theme.thumbnails.map((t) => t.replace("public/", "/")),
            mainThumbnail: theme.thumbnails[0].replace("public/", "/"),
            slug: theme.archiveFilename.replace(".sit", ""),
            urlBase: customSlugify(`${id}-${theme.name}`),
            isAirtable: false,
            isNew: false,
            createdAt: new Date(0),
          };
        }),
      )
      .map(async (theme, _index, array) => {
        const rawLikes = await getLikesForTheme(theme.id);
        const likesCount = rawLikes.length;
        return {
          ...theme,
          likes: likesCount,
          relatedThemes: array
            .filter(
              (t) => t.archiveFile === theme.archiveFile && t.id !== theme.id,
            )
            .map((t) => t.id),
        };
      }),
  );

  return orderBy(result, ["createdAt"], ["desc"]);
}

export async function themeAuthorsLoader() {
  const themes = await themesLoader();

  const baseAuthors = new Set(
    themes
      .flatMap((t) => {
        return t.authors;
      })
      .filter((a) => !!a)
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())),
  );
  const authorsWithNumbers = Array.from(baseAuthors).map((a) => {
    return {
      author: a,
      themes: themes.filter((t) => t.authors.includes(a)).map((t) => t.id),
    };
  });

  return Array.from(authorsWithNumbers).map((a) => {
    return {
      name: a.author,
      id: a.author,
      slug: customSlugify(a.author),
      url: `/authors/${customSlugify(a.author)}`,
      themes: a.themes,
    };
  });
}

// To fix random typos I've made while recording the themes...
const namesCorrectionMap = {
  "Albie Wong": ["Albie Wong", "albie wong"],
  "alta design": ["alta design", "Alta Design"],
  Amphagorey: ["amphagorey", "Amphagorey", "Amphaorey"],
  Andi: ["Andi", "andi"],
  "Andrew Bartlett": ["Andrew Bartlett", "Andrew Bertlett"],
  "April G": ["April G", "April G."],
  "Bryan James Gatten": ["Bryan James Gatten", "Bryan James Gatten"],
  "Carl Johan Rehbinde": ["Carl Johan Rehbinde", "Carl Johan Rehbinder"],
  "Curtis Townson": ["Curtis Townson", "Curtis townson", "curtis townson"],
  "Daniel E. Stanczak": ["Daniel E. Stanczak", "Daniel Stanczak"],
  "David W. Neal": ["David Neal", "David W. Neal"],
  "david witzling": ["david witzling", "David Witzling"],
  DESIGN: ["Design", "DESIGN"],
  "Digital Volume": ["Digital Volume", "DigitalVolume"],
  dobin: ["dobin", "Dobin"],
  "Doug Thornsjo": ["Doug Thornsjo", "Douglas Thornsjo"],
  "Duchesne Nrick": ["Duchesne Nrick", "Duichesne Brick"],
  ed: ["ed", "Ed"],
  "Eduardo Da Costa": ["Eduardo Da Costa", "Eduardo Da Costa"],
  emi: ["emi", "Emi"],
  "Erik Soderlund": ["Erik Soderlund", "Erik Sôderlund", "Erik Söderlund"],
  "Esse Design": ["Esse Design", "Moss Design"],
  "G. Vié": ["G. Vie", "G. Vié"],
  "Gaeme Hunt": ["Gaeme Hunt", "Graeme C. Hunt", "Graeme Hunt"],
  "Hans van Kampen": ["Hans v. Kampen", "Hans van Kampen"],
  hardc0rp: ["Hardc0rp", "hardc0rp"],
  "Hideaki Kamada": ["Hideaki Kamada", "Kideaki Kamada"],
  "Hiroki Ryukai": ["Hiroki Ryukai", "Niroki Ryukai"],
  "I.E. Thatis": ["I. E. Thatis", "I.E. Thatis"],
  "J.Ubique": ["J. Ubique", "J.Ubique"],
  "James Chandler": ["james Chandler", "James Chandler"],
  "Janet Parris": [
    "Janet Parris",
    "Janet S. Parris",
    "Janet Snider Parris",
    "Janet SniderParris",
  ],
  "Jean-Sébastien Levesque": [
    "Jean-Sebastien Levesque",
    "Jean-Sébastien Levesque",
  ],
  "Jeff Parrott": ["Jeff Parrot", "Jeff Parrott"],
  jen: ["jen", "jeni"],
  "Jen Maher-Bontrager": ["Jen Maher-Bontrager", "Jennifer Maher-Bontrager"],
  "Jeremy Gale": ["Jeremt Gale", "Jeremy Gale"],
  jiji: ["jiji", "Jiji"],
  "JKK Software": ["JKK Software", "JKK Software"],
  "Jorge Salvador Caffarena": [
    "Jorge Salvador Caffarena",
    "Jorge Salvador Caffarena",
  ],
  "Josh Oakes": ["Josh Oakes", "Joshua Oakes"],
  "Julie LeDuc": ["Julie LeDuc", "Julie Leduc"],
  "Julieta Lescano": ["Julieta Lescano", "Julitera Lescano"],
  "Karl von Laudermann": ["Karl von Laudermann", "Karl Von Laudermann"],
  KAYSHA: ["Kaysha", "KaySha", "KAYSHA"],
  "Kazuomi Suzuki": ["Kazuami Suzuki", "Kazuomi Suzuki"],
  "Kei Kinoshita": ["Kei Kinoshita", "Kei M Kinoshita"],
  "Ken Yaecker": ["Ken Vaecker", "Ken Yaecker"],
  "Kyle Demich": ["Kyle Demich", "Kyle G. Demich"],
  "Larry Butler": ["Larry Butler", "LarryButler"],
  "Lilinah Biti Anat": ["Lilinah Biti Anat", "Lilinah biti-Anat"],
  "Martha Royer": [
    "Martha Roter",
    "Martha Royer",
    "Martha royer",
    "martha Royer",
  ],
  "Matt Chisholm": [
    "Matt Chisholm",
    "matt chisholm",
    "Matt Chrisholm",
    "Mattt Chisholm",
  ],
  "Matthew Chandler": ["Matthew Chandler", "Matthew Charlton"],
  MeNou: ["MeNOU", "MeNou"],
  'Michael O"Brien': ['Michael O"Brien', 'Michael R. O"Brien'],
  "Mikael Hakansson": ["Mikael Hakansson", "Mikael Håkansson"],
  // "Mike Thompson": ["Mike Thompson", "Rick Thompson"],
  "Nancy Malvina Ibsen": ["Nancy Malvina Ibsen", "Nancy Malvina Ibson"],
  "Nic Wright": ["Nic Wright", "Nick Wright"],
  "Nitehawk Jarett": ["Nitehawk Jarett", "Nitehawk Jarrett"],
  "Norizumi Moro-Oka": ["Norizumi Moro-Oka", "Norizumi Morooka"],
  "Orion Dimitrakopoulos": ["Orion Dimitrakopoulos", "Orion Dimitrakopoulous"],
  "Pete Garlinski": ["Pete Garlinski", "Peter J. Garlinski"],
  "Peter Baird": ["Peter Baird", "Peter J. Baird"],
  "Ramon Cahenzii": ["Ramon Cahenzii", "Ramon Cahenzli"],
  "Randy Allen Chikosky": ["Randy Allen Chikosky", "Randy Chikosky"],
  "René van den Berg": ["Rene van den Berg", "René van den Berg"],
  "ric zito": ["ric zito", "Ric Zito"],
  "Richard C. Miske": ["Richard C. Miske", "Richard Miske"],
  "Robert Davis": ["Robert Davis", "robert davis"],
  "Robert Mcanally": ["Robert Mcanally", "Robert McAnally"],
  "Robin Rundkvist": ["Robin Rundkvist", "Robin Rundvist"],
  "Ronald ter Neuzen": ["Ronald ter Neuzen", "Ronald ter Neuzen"],
  "Russeli Silver": [
    "Russeli Silver",
    "Russell silver",
    "Russel P. Silver Jr",
    "Russell Silver",
  ],
  "S.R. Simons": ["S. R. Simons", "S.R. Simons"],
  "Sam Blumer": ["Sam Blumer", "Tim Blumer"],
  "Sandy Marnat-Damez": ["Sandy Marnat-Damez", "Sandy Marnet-Damez"],
  "Scott Hunter": ["Scott Hunter", "Scott hunter"],
  "Shinichi Kubota": ["Shinichi Kubota", "shinichi kubota"],
  shiocop: ["shiocop", "Shiocop"],
  "Sin Kubota": ["Sin Kubota", "sin kubota"],
  "Stephen Crocker": [
    "Stephen Crocker",
    "Stephen K. Crocker",
    "Stephen K. crocker",
  ],
  "Steve Sulzer": ["Steve Sulzer", "Steven M. Sulzer"],
  "Sven Berg Ryen": ["Sven Berg Ryen", "Sven Berg Ryen"],
  "Thomas Lee": ["Thomas Lee", "Thomas R. Lee"],
  "timechanic industries": ["timechanic industries", "timechanic industries"],
  "Tobias Tornblom": ["Tobias Tornblom", "Tobias Törnblom"],
  "Waynne Warren": ["Waynne Warren", "Waynne Warrern"],
  "William Bart": ["William Bart", "William Martin"],
  "Woo Kong Teik": ["Woo Kong Teik", "Woo Kong Teik"],
};

const findCorrectedName = (maybeWrongName: string) => {
  return (
    Object.entries(namesCorrectionMap).find(([, values]) => {
      return values.includes(maybeWrongName);
    })?.[0] ?? maybeWrongName
  );
};

function makeAuthorsFromAuthorsString(authors: string): string[] {
  return uniq(
    (authors || "")
      .split(/(?:\sand\s|,|&)/i)
      .map((l) => l.trim().replaceAll(`'`, `"`))
      .filter((a) => !!a)
      .map((a) => findCorrectedName(a)),
  );
}
