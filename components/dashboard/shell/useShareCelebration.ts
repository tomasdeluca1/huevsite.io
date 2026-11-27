import { useEffect } from "react";

export function useShareCelebration(username: string | undefined, enabled: boolean, onCelebrate: () => void) {
  useEffect(() => {
    if (!username || !enabled) return;
    const key = `huevsite_share_celebrated_${username}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
    onCelebrate();
  }, [username, enabled, onCelebrate]);
}
