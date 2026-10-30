import { createBrowserRouter } from "react-router-dom";
import Layout from "./Layout";
import Home from "./pages/Home";
import LearnMore from "./pages/LearnMore";
import ClinicLabSearch from "./pages/ClinicLabSearch";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPasswordPage from "./pages/Forget Password/ForgotPasswordPage";

import PatientLayout from "./components/Patient/PatientLayout";
import Dashboard from "./pages/Patient/Dashboard";
import MedicalFile from "./pages/Patient/MedicalFile";
import Prescriptions from "./pages/Patient/Prescriptions";
import Results from "./pages/Patient/Results";
import SymptomTriage from "./pages/Patient/SymptomTriage";
import Booking from "./pages/Patient/Booking";
import Appointments from "./pages/Patient/Appointments";
import Permissions from "./pages/Patient/Permissions";
import Profile from "./pages/Patient/Profile";
import AccountSettings from "./pages/Patient/AccountSettings";

import LabLayout from "./components/Lab/LabLayout";
import LabDashboard from "./pages/Lab/LabDashboard";
import AddRequest from "./pages/Lab/AddRequest";
import RequestDetails from "./pages/Lab/RequestDetails";
import UploadResult from "./pages/Lab/UploadResult";
import ResultsLog from "./pages/Lab/ResultsLog";
import LabProfile from "./pages/Lab/LabProfile";
import LabLanguage from "./pages/Lab/LabLanguage";
import LabAppearance from "./pages/Lab/LabAppearance";
import LabPersonal from "./pages/Lab/LabPersonal";
import LabAccount from "./pages/Lab/LabAccount";

const labRoutes = {
  path: "/lab",
  element: <LabLayout />,
  children: [
    { index: true, element: <LabDashboard /> },
    { path: "add", element: <AddRequest /> },
    { path: "details", element: <RequestDetails /> },
    { path: "details/:id", element: <RequestDetails /> },
    { path: "upload", element: <UploadResult /> },
    { path: "upload/:id", element: <UploadResult /> },
    { path: "results", element: <ResultsLog /> },
    { path: "settings/profile", element: <LabProfile /> },
    { path: "settings/language", element: <LabLanguage /> },
    { path: "settings/appearance", element: <LabAppearance /> },
    { path: "settings/personal", element: <LabPersonal /> },
    { path: "settings/account", element: <LabAccount /> },
  ],
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "learn-more", element: <LearnMore /> },
      { path: "ClinicLabSearch", element: <ClinicLabSearch /> },
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
    ],
  },

  {
    path: "/patient",
    element: <PatientLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "medical-file", element: <MedicalFile /> },
      { path: "prescriptions", element: <Prescriptions /> },
      { path: "results", element: <Results /> },
      { path: "symptom-triage", element: <SymptomTriage /> },
      { path: "book", element: <Booking /> },
      { path: "appointments", element: <Appointments /> },
      { path: "permissions", element: <Permissions /> },
      { path: "profile", element: <Profile /> },
      { path: "account-settings", element: <AccountSettings /> },
    ],
  },

  labRoutes,
]);