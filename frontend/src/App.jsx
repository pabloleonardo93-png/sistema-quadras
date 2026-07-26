import AppRoutes from "./routes/AppRoutes";
import { CookieConsent } from "./components/CookieConsent";

function App() {
  return (
    <>
      <AppRoutes />
      <CookieConsent />
    </>
  );
}

export default App;
