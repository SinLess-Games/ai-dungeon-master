import { createFileRoute } from "@tanstack/react-router";
import { DiceRollerPage } from "@/modules/dice/ui/DiceRollerPage";

export const Route = createFileRoute("/dice")({ component: DiceRollerPage });
