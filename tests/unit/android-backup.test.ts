import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readRepoFile(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(`../../${relativePath}`, import.meta.url)), "utf8");
}

describe("Android backup configuration", () => {
  it("keeps WebView storage out of cloud backup and device transfer", () => {
    const manifest = readRepoFile("android/app/src/main/AndroidManifest.xml");
    const legacyRules = readRepoFile("android/app/src/main/res/xml/backup_rules.xml");
    const extractionRules = readRepoFile("android/app/src/main/res/xml/data_extraction_rules.xml");

    expect(manifest).toContain('android:allowBackup="false"');
    expect(manifest).toContain('android:fullBackupContent="@xml/backup_rules"');
    expect(manifest).toContain('android:dataExtractionRules="@xml/data_extraction_rules"');

    for (const domain of ["root", "file", "database", "sharedpref", "external"]) {
      expect(legacyRules).toContain(`<exclude domain="${domain}" path="." />`);
      expect(extractionRules).toContain(`<exclude domain="${domain}" path="." />`);
    }
    expect(extractionRules).toContain("<cloud-backup>");
    expect(extractionRules).toContain("<device-transfer>");
  });
});
