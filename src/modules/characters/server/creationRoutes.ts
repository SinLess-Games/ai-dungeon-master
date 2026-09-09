/// <reference types="@cloudflare/workers-types" />

import { Hono } from "hono";
import type { AuthEnv } from "@/modules/auth/server/auth";
import { characterCastingCreationRoutes } from "./castingCreationRoutes";
import { characterClassChoiceCreationRoutes } from "./classChoiceCreationRoutes";
import { characterCompanionCreationRoutes } from "./companionCreationRoutes";
import { characterDivineCreationRoutes } from "./divineCreationRoutes";
import { characterEquipmentCreationRoutes } from "./equipmentCreationRoutes";
import { characterFeatCreationRoutes } from "./featCreationRoutes";
import { characterSkillLanguageRoutes } from "./skillLanguageRoutes";

interface CharacterCreationBindings extends AuthEnv {
  DB?: D1Database;
}
type CharacterCreationEnv = { Bindings: CharacterCreationBindings };

export const characterCreationRoutes = new Hono<CharacterCreationEnv>()
  .route("/", characterSkillLanguageRoutes)
  .route("/", characterFeatCreationRoutes)
  .route("/", characterEquipmentCreationRoutes)
  .route("/", characterCastingCreationRoutes)
  .route("/", characterDivineCreationRoutes)
  .route("/", characterCompanionCreationRoutes)
  .route("/", characterClassChoiceCreationRoutes);