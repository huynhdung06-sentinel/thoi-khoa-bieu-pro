sed -i 's/import { getChildData, saveChildData, auth } from ".\/lib\/firebase";/import { getChildData, saveChildData, auth, signOut } from ".\/lib\/firebase";/' src/App.tsx
sed -i 's/import(".\/lib\/firebase").then(({ signOut }) => signOut().then(() => setIsIntroOpen(true)));/signOut().then(() => setIsIntroOpen(true));/' src/App.tsx
