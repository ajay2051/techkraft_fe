import { BrowserRouter, Route, Routes } from "react-router-dom";
import {ApplyPage} from "./pages/Apply.tsx";
import {ReviewerAdminLoginPage} from "./pages/Login.tsx";
import {NotFoundPage} from "./pages/NotFound.tsx";
import {AdminRegistrationPage, ReviewerRegistrationPage} from "./pages/Registration.tsx";


function Layout() {


    return (
        <>

            <Routes>
                <Route path="/"      element={<ApplyPage />}/>
                <Route path="/login"      element={<ReviewerAdminLoginPage />}/>
                <Route path="/register/reviewer" element={<ReviewerRegistrationPage />} />
                <Route path="/register/admin" element={<AdminRegistrationPage />} />

                <Route path="*" element={<NotFoundPage />} />
            </Routes>

        </>
    );
}


function App() {
  return (
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
  );
}

export default App;