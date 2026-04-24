"use client";

import { createContext, useContext, useEffect, useState } from "react";

const UserContext = createContext<any>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
const [user, setUser] = useState<any>(null);
const [loadingUser, setLoadingUser] = useState(true);

const getUser = async () => {

try {

const res = await fetch("/api/auth/me", {
credentials: "include",

});

  const data = await res.json();
  setUser(data.user);

} catch {
  setUser(null);

} finally {
  setLoadingUser(false);

}
};

useEffect(() => {
getUser();
}, []);

return (
<UserContext.Provider value={{ user, setUser, loadingUser }}>
{children}
</UserContext.Provider>
);
}

export function useUser() {
return useContext(UserContext);
}