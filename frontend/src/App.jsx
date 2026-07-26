import { useLayoutEffect } from "react";
import AppRoutes from "./routes/AppRoutes";
import { CookieConsent } from "./components/CookieConsent";
import { removeInitialBootIntro } from "./utils/initialBootIntro";

function App() {
  useLayoutEffect(() => {
    if (window.location.pathname !== "/") {
      removeInitialBootIntro();
    }
  }, []);

  return (
    <>
      <AppRoutes />
      <CookieConsent />
    </>
  );
}

export default App;
