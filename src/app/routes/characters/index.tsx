import { createFileRoute } from "@tanstack/react-router";
import { CharacterLibrary } from "@/modules/characters/ui/CharacterLibrary";

export const Route = createFileRoute("/characters/")({
  component: CharacterLibrary,
});
