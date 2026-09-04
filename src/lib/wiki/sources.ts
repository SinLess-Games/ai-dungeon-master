/**
 * Where the wiki's material comes from. Book count is derived from the
 * sourcebooks stored in project file storage; web sources are listed here.
 */

const bookPointers = import.meta.glob("../../assets/books/*.asset.json", { eager: true });

export const SOURCE_BOOK_COUNT = Object.keys(bookPointers).length;

export const WEB_SOURCES = [
  { name: "System Reference Document (open d20 rules)", url: "https://www.d20srd.org/" },
];

export const SOURCE_WEBSITE_COUNT = WEB_SOURCES.length;
