/// <reference types="@cloudflare/workers-types" />

import { Hono } from "hono";
import type { AuthEnv } from "@/modules/auth/server/auth";
import { characterAdvancedCreationRoutes } from "./advancedCreationRoutes";
import { characterCastingCreationRoutes } from "./castingCreationRoutes";
import { characterClassChoiceCreationRoutes } from "./classChoiceCreationRoutes";
import { characterCompanionCreationRoutes } from "./companionCreationRoutes";
import { characterDivineCreationRoutes } from "./divineCreationRoutes";
import { characterEquipmentCreationRoutes } from "./equipmentCreationRoutes";
import { characterFeatCreationRoutes } from "./featCreationRoutes";
import { characterFinalizeCreationRoutes } from "./finalizeCreationRoutes";
import { characterOptionRoutes } from "./optionsRoutes";
import { characterSkillLanguageRoutes } from "./skillLanguageRoutes";

interface CharacterCreationBindings extends AuthEnv {
  DB?: D1Database;
}
type CharacterCreationEnv = { Bindings: CharacterCreationBindings };

export const characterCreationRoutes = new Hono<CharacterCreationEnv>()
  .route("/", characterAdvancedCreationRoutes)
  .route("/", characterOptionRoutes)
  .route("/", characterFinalizeCreationRoutes)
  .route("/", characterSkillLanguageRoutes)
  .route("/", characterFeatCreationRoutes)
  .route("/", characterEquipmentCreationRoutes)
  .route("/", characterCastingCreationRoutes)
  .route("/", characterDivineCreationRoutes)
  .route("/", characterCompanionCreationRoutes)
  .route("/", characterClassChoiceCreationRoutes);
