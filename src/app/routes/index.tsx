import { useAuthModal } from "@/shared/stores/authModal.store";
import { authClient } from "@/modules/auth/client/authClient";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Compass, Dices, Users } from "lucide-react";
import background from "@/assets/background.png";
import logo from "@/assets/logo.png";
import persistentWorlds from "@/assets/persistent_worlds.png";
import dungeonMaster from "@/assets/living_dungeoun_master.png";
import multipleSystems from "@/assets/multiple_systems.png";
import "@/styles/home.css";

export const Route = createFileRoute("/")({ component: HomePage });

const features = [
  {
    title: "Persistent Worlds",
    description: "Explore living worlds that evolve with your choices.",
    image: persistentWorlds,
    icon: BookOpen,
  },
  {
    title: "Living Dungeon Master",
    description: "A rules-aware AI DM that remembers and adapts.",
    image: dungeonMaster,
    icon: Users,
  },
  {
    title: "Multiple Rulesets",
    description: "Built for D&D 3.5 with deep rules support and more to come.",
    image: multipleSystems,
    icon: Dices,
  },
];

function HomePage() {
  const { data: session } = authClient.useSession();
  return (
    <main className="codex-home" style={{ backgroundImage: `url(${background})` }}>
      <div className="codex-home-inner">
        <section className="codex-hero" aria-labelledby="hero-title">
          <div className="codex-hero-emblem">
            <img
              src={logo}
              alt="The Endless Codex — AI adventure without limits, D&D 3.5"
              width={1536}
              height={1024}
              fetchPriority="high"
            />
          </div>
          <div className="codex-hero-copy">
            <p className="codex-eyebrow">Sinless Games</p>
            <h1 id="hero-title">
              <span>Infinite Stories</span>Always Within Reach
            </h1>
            <div className="codex-hero-rule" aria-hidden="true">
              <span>✧</span>
            </div>
            <p className="codex-hero-description">
              A persistent tabletop role-playing platform where worlds remember, characters endure,
              and the Dungeon Master never forgets.
            </p>
            <div className="codex-hero-actions">
              {session ? (
                <Link to="/characters/new" className="codex-cta-primary">
                  <Compass aria-hidden="true" />
                  Create a Character
                  <ArrowRight size={19} aria-hidden="true" />
                </Link>
              ) : (
                <button
                  type="button"
                  className="codex-cta-primary"
                  onClick={useAuthModal.getState().openSignup}
                >
                  <Compass aria-hidden="true" />
                  Enter the Codex
                  <ArrowRight size={19} aria-hidden="true" />
                </button>
              )}
              <a href="#features" className="codex-cta-secondary">
                <BookOpen aria-hidden="true" />
                Learn More
              </a>
            </div>
          </div>
        </section>
        <section
          id="features"
          className="codex-features"
          aria-label="Discover Endless Codex"
          tabIndex={-1}
        >
          {features.map(({ title, description, image, icon: Icon }) => (
            <article
              key={title}
              className="codex-feature"
              style={{
                backgroundImage: `linear-gradient(90deg, #03090df2, #03090dbb 65%, #03090d66), url(${image})`,
              }}
            >
              <span className="codex-feature-icon">
                <Icon aria-hidden="true" />
              </span>
              <div>
                <h2>{title}</h2>
                <p>{description}</p>
              </div>
            </article>
          ))}
        </section>
        <footer className="codex-home-footer">
          <p>
            <span aria-hidden="true">✧</span>Your story never ends<span aria-hidden="true">✧</span>
          </p>
          <Link to="/status">Service status</Link>
        </footer>
      </div>
    </main>
  );
}
