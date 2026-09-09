import { createFileRoute } from "@tanstack/react-router";
import { AdvancedCharacterCreator } from "@/modules/characters/ui/AdvancedCharacterCreator";

export const Route = createFileRoute("/characters/new")({
  component: AdvancedCharacterCreator,
});
