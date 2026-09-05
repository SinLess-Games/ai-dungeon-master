-- 1. Profiles: signed-in members only (was readable by the public internet)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Signed-in users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

REVOKE SELECT ON public.profiles FROM anon;

-- 2. SECURITY DEFINER functions: only expose what RLS actually needs.
--    has_role must stay callable by authenticated because RLS policies
--    evaluate it as the querying role.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.has_active_subscription(uuid, text) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- 3. map-art storage: re-verify folder ownership on the written row too,
--    so an update cannot move a file into another user's folder.
DROP POLICY IF EXISTS "map art update own" ON storage.objects;
CREATE POLICY "map art update own"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'map-art'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'map-art'
  AND auth.uid()::text = (storage.foldername(name))[1]
);