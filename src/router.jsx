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

import ReceptionLayout from "./pages/reception/ReceptionLayout";
import ReceptionDashboard from "./pages/reception/ReceptionDashboard";
import AppointmentsManager from "./pages/reception/AppointmentsManager";
import PatientsDataPage from "./pages/reception/PatientsDataPage";
import ReceptionProfile from "./pages/reception/ReceptionProfile";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "learn-more",
        element: <LearnMore />,
      },
      {
        path: "ClinicLabSearch",
        element: <ClinicLabSearch />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "register",
        element: <Register />,
      },
      {
        path: "forgot-password",
        element: <ForgotPasswordPage />,
      },
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

  {
    path: "/reception",
    element: <ReceptionLayout />,
    children: [
      { index: true, element: <ReceptionDashboard /> },
      { path: "appointments", element: <AppointmentsManager /> },
      { path: "patients", element: <PatientsDataPage /> },
      { path: "profile", element: <ReceptionProfile /> },
    ],
  },
]);
