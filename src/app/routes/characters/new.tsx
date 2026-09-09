import { createFileRoute } from "@tanstack/react-router";
import { CharacterCreator } from "@/modules/characters/ui/CharacterCreator";

export const Route = createFileRoute("/characters/new")({
  component: CharacterCreator,
});
