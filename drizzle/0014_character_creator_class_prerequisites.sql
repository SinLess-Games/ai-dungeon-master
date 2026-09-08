-- Structured level-1 alignment prerequisites for core D&D 3.5 base classes.
-- Keeping these as prerequisite expressions lets the creator consume the same
-- data shape that future class/progression validation will use.

INSERT OR IGNORE INTO `dnd35_class_prerequisites` (`class_id`, `expression`, `explanation`) VALUES
  (
    'ec-srd35-class-barbarian-v1',
    '{"version":1,"condition":{"kind":"alignment","allowed":["NG","CG","N","CN","NE","CE"]}}',
    'Requires a nonlawful alignment.'
  ),
  (
    'ec-srd35-class-bard-v1',
    '{"version":1,"condition":{"kind":"alignment","allowed":["NG","CG","N","CN","NE","CE"]}}',
    'Requires a nonlawful alignment.'
  ),
  (
    'ec-srd35-class-druid-v1',
    '{"version":1,"condition":{"kind":"alignment","allowed":["NG","LN","N","CN","NE"]}}',
    'Requires an alignment with a neutral component.'
  ),
  (
    'ec-srd35-class-monk-v1',
    '{"version":1,"condition":{"kind":"alignment","allowed":["LG","LN","LE"]}}',
    'Requires a lawful alignment.'
  ),
  (
    'ec-srd35-class-paladin-v1',
    '{"version":1,"condition":{"kind":"alignment","allowed":["LG"]}}',
    'Requires lawful good alignment.'
  );
