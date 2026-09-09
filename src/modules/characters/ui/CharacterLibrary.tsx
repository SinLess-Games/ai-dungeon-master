import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { BookOpen, Plus, Shield, Swords, UserRound } from "lucide-react";
import { authClient } from "@/modules/auth/client/authClient";
import { useAuthModal } from "@/shared/stores/authModal.store";
import { listCharacters, type CharacterLibraryItem } from "../client/creatorApi";
import "./character-creator.css";
import "./advanced-character-creator.css";

function classSummary(character: CharacterLibraryItem) {
  const firstLevel = character.classes.filter(({ characterLevel }) => characterLevel === 1);
  if (firstLevel.length === 0) return "Class not selected";
  return firstLevel
    .sort((a, b) => a.track - b.track)
    .map(({ className }) => className)
    .join(character.progressionMode === "gestalt" ? " // " : " / ");
}

function readableStatus(status: string) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function CharacterLibrary() {
  const session = authClient.useSession();
  const characters = useQuery({
    queryKey: ["characters", "library"],
    queryFn: listCharacters,
    enabled: Boolean(session.data),
  });

  if (session.isPending) {
    return (
      <main className="character-library-page" id="main-content">
        <section className="character-library-shell character-library-empty">
          <BookOpen size={38} />
          <h2>Opening your character folio…</h2>
          <p>Loading saved adventurers.</p>
        </section>
      </main>
    );
  }

  if (!session.data) {
    return (
      <main className="character-library-page" id="main-content">
        <section className="character-library-shell character-library-empty">
          <UserRound size={42} />
          <h2>Sign in to see your characters</h2>
          <p>Your character library follows your Endless Codex account.</p>
          <button className="creator-primary" onClick={useAuthModal.getState().openLogin}>Sign in</button>
        </section>
      </main>
    );
  }

  if (characters.isLoading) {
    return (
      <main className="character-library-page" id="main-content">
        <section className="character-library-shell character-library-empty">
          <BookOpen size={38} />
          <h2>Gathering your adventurers…</h2>
          <p>Loading characters and campaign memberships.</p>
        </section>
      </main>
    );
  }

  if (characters.error) {
    return (
      <main className="character-library-page" id="main-content">
        <section className="character-library-shell character-library-empty">
          <Shield size={42} />
          <h2>Your character library could not be loaded</h2>
          <p>{characters.error.message}</p>
          <button className="creator-primary" onClick={() => void characters.refetch()}>Try again</button>
        </section>
      </main>
    );
  }

  const items = characters.data ?? [];
  return (
    <main className="character-library-page" id="main-content">
      <div className="character-library-shell">
        <header className="character-library-header">
          <div>
            <p className="creator-eyebrow">YOUR ADVENTURERS</p>
            <h1>Characters</h1>
            <p>{items.length === 0 ? "Create your first persistent adventurer." : `${items.length} saved character${items.length === 1 ? "" : "s"} across your campaigns.`}</p>
          </div>
          <Link to="/characters/new" className="creator-primary"><Plus size={17} /> Create character</Link>
        </header>

        {items.length === 0 ? (
          <section className="character-library-empty">
            <UserRound size={48} />
            <h2>No characters yet</h2>
            <p>Once you create a character, every saved adventurer will appear here.</p>
            <Link to="/characters/new" className="creator-primary"><Swords size={17} /> Forge your first adventurer</Link>
          </section>
        ) : (
          <section className="character-library-grid" aria-label="Saved characters">
            {items.map((character) => (
              <article className="character-library-card" key={character.id}>
                <div className="character-library-card-top">
                  <div>
                    <h2>{character.name}</h2>
                    <p>{character.raceName ?? "Race not selected"} · {classSummary(character)}</p>
                  </div>
                  <span className="creator-pill">{readableStatus(character.status)}</span>
                </div>
                <div className="character-library-badges">
                  <span>LA +{character.levelAdjustment ?? 0}</span>
                  {character.progressionMode === "gestalt" && <span className="gestalt">Gestalt</span>}
                  {character.progressionMode !== "gestalt" && <span>Standard</span>}
                  <span>{readableStatus(character.campaignStatus)} campaign</span>
                </div>
                <div className="character-library-meta">
                  <div><span>Campaign</span><strong>{character.campaignName}</strong></div>
                  <div><span>Classes</span><strong>{classSummary(character)}</strong></div>
                  <div><span>Character ID</span><strong>{character.id.slice(0, 8)}…</strong></div>
                  <div><span>Updated</span><strong>{new Date(character.updatedAt).toLocaleDateString()}</strong></div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
