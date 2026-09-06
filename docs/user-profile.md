# User profile

Open **My profile** from the account menu, or visit `/user/profile`.

Signed-in users can update their display name and unique username through Better Auth's authenticated `updateUser` endpoint. The username retains display casing and is normalized for sign-in. The existing username validator and uniqueness constraint apply to updates. Saving refreshes the Better Auth session; the form keeps edits when a save fails and offers Discard changes.

The page also shows the existing provider avatar (or a default icon), account role, join month, and read-only email. Email changes remain unavailable. Users can preview, save, or remove a profile picture (PNG/JPEG/WebP, up to 5 MB); the browser crops and re-encodes it as a 192px WebP thumbnail stored in the existing image field. The server limits profile thumbnails to 32 KB of base64 data. No object-storage setup is required. Password changes use Better Auth with the current password and revoke other sessions. Social-only users manage their password with their provider. The shared navbar stays visible while scrolling. Signed-out users see a sign-in prompt, with loading and retry states for session requests. No database migration is needed.

Validation: production build/typecheck, focused ESLint, and the isolated auth browser suite cover profile navigation, update persistence after reload, duplicate usernames, discard, signed-out access, and desktop/mobile overflow.
