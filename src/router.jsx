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

import DoctorLayout from "./components/Doctor/DoctorLayout";
import DoctorDashboard from "./pages/Doctor/DoctorDashboard";
import Patients from "./pages/Doctor/Patients";
import PatientFile from "./pages/Doctor/PatientFile";
import Exam from "./pages/Doctor/Exam";
import Team from "./pages/Doctor/Team";
import ProfessionalProfile from "./pages/Doctor/ProfessionalProfile";
import Schedule from "./pages/Doctor/Schedule";
import DoctorProfile from "./pages/Doctor/DoctorProfile";
import DoctorAccountSettings from "./pages/Doctor/DoctorAccountSettings";

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

  { path: "/", element: <Layout />, children: [ /* كما هي */ ] },

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
  path: "/doctor",
  element: <DoctorLayout />,
  children: [
    { index: true, element: <DoctorDashboard /> },
    { path: "patients", element: <Patients /> },
    { path: "patient-file", element: <PatientFile /> },
    { path: "exam", element: <Exam /> },
    { path: "team", element: <Team /> },
    { path: "professional-profile", element: <ProfessionalProfile /> },
    { path: "schedule", element: <Schedule /> },
    { path: "profile", element: <DoctorProfile /> },
    { path: "account-settings", element: <DoctorAccountSettings /> },
  ],
},
]);

