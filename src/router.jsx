import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import ScrollToHash from './components/home/ScrollToHash.jsx';
import RequireRole from './components/shell/RequireRole.jsx';
import { AccountPage, ProfilePage } from './components/shell/AccountPages.jsx';

import Home from './pages/home/Home.jsx';
import LearnMore from './pages/home/LearnMore.jsx';
import ClinicLabSearch from './pages/home/ClinicLabSearch.jsx';
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';

import PatientLayout from './pages/patient/PatientLayout.jsx';
import PtDashboard from './pages/patient/Dashboard.jsx';
import MedicalFile from './pages/patient/MedicalFile.jsx';
import Prescriptions from './pages/patient/Prescriptions.jsx';
import Results from './pages/patient/Results.jsx';
import SymptomTriage from './pages/patient/SymptomTriage.jsx';
import Booking from './pages/patient/Booking.jsx';
import PtAppointments from './pages/patient/Appointments.jsx';
import Permissions from './pages/patient/Permissions.jsx';
import PtProfile from './pages/patient/Profile.jsx';

import DoctorLayout from './pages/doctor/DoctorLayout.jsx';
import DrDashboard from './pages/doctor/Dashboard.jsx';
import DrPatients from './pages/doctor/Patients.jsx';
import PatientFile from './pages/doctor/PatientFile.jsx';
import Exam from './pages/doctor/Exam.jsx';
import Schedule from './pages/doctor/Schedule.jsx';
import Team from './pages/doctor/Team.jsx';
import Professional from './pages/doctor/Professional.jsx';

import LabLayout from './pages/lab/LabLayout.jsx';
import LabDashboard from './pages/lab/LabDashboard.jsx';
import AddRequest from './pages/lab/AddRequest.jsx';
import RequestDetails from './pages/lab/RequestDetails.jsx';
import UploadResult from './pages/lab/UploadResult.jsx';
import ResultsLog from './pages/lab/ResultsLog.jsx';
import LabProfile from './pages/lab/LabProfile.jsx';

import ReceptionLayout from './pages/reception/ReceptionLayout.jsx';
import RcDashboard from './pages/reception/Dashboard.jsx';
import RcAppointments from './pages/reception/Appointments.jsx';
import RcPatients from './pages/reception/Patients.jsx';

import AdminLayout from './pages/admin/AdminLayout.jsx';
import Monitoring from './pages/admin/Monitoring.jsx';
import Licenses from './pages/admin/Licenses.jsx';
import Accounts from './pages/admin/Accounts.jsx';

const Root = () => (<><ScrollToHash /><Outlet /></>);
const guard = (role, el) => <RequireRole role={role}>{el}</RequireRole>;

export const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/learn-more', element: <LearnMore /> },
      { path: '/ClinicLabSearch', element: <ClinicLabSearch /> },
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
      { path: '/forgot-password', element: <ForgotPassword /> },

      {
        path: '/patient', element: guard('patient', <PatientLayout />),
        children: [
          { index: true, element: <PtDashboard /> },
          { path: 'file', element: <MedicalFile /> },
          { path: 'prescriptions', element: <Prescriptions /> },
          { path: 'results', element: <Results /> },
          { path: 'triage', element: <SymptomTriage /> },
          { path: 'booking', element: <Booking /> },
          { path: 'appointments', element: <PtAppointments /> },
          { path: 'permissions', element: <Permissions /> },
          { path: 'profile', element: <PtProfile /> },
          { path: 'account', element: <AccountPage notifs={['notifEmail', 'notifAppt', 'notifMeds', 'notifAccess']} /> },
        ],
      },
      {
        path: '/doctor', element: guard('doctor', <DoctorLayout />),
        children: [
          { index: true, element: <DrDashboard /> },
          { path: 'patients', element: <DrPatients /> },
          { path: 'patient-file', element: <PatientFile /> },
          { path: 'exam', element: <Exam /> },
          { path: 'schedule', element: <Schedule /> },
          { path: 'team', element: <Team /> },
          { path: 'professional', element: <Professional /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'account', element: <AccountPage notifs={['notifEmail', 'notifAppt', 'notifAccess']} /> },
        ],
      },
      {
        path: '/lab', element: guard('lab', <LabLayout />),
        children: [
          { index: true, element: <LabDashboard /> },
          { path: 'add', element: <AddRequest /> },
          { path: 'details', element: <RequestDetails /> },
          { path: 'details/:id', element: <RequestDetails /> },
          { path: 'upload', element: <UploadResult /> },
          { path: 'upload/:id', element: <UploadResult /> },
          { path: 'results', element: <ResultsLog /> },
          { path: 'settings/profile', element: <LabProfile /> },
          { path: 'settings/personal', element: <ProfilePage /> },
          { path: 'settings/account', element: <AccountPage notifs={['notifEmail', 'notifNew']} /> },
        ],
      },
      {
        path: '/reception', element: guard('reception', <ReceptionLayout />),
        children: [
          { index: true, element: <RcDashboard /> },
          { path: 'appointments', element: <RcAppointments /> },
          { path: 'patients', element: <RcPatients /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'account', element: <AccountPage notifs={['notifEmail', 'notifAppt']} /> },
        ],
      },
      {
        path: '/admin', element: guard('admin', <AdminLayout />),
        children: [
          { index: true, element: <Monitoring /> },
          { path: 'licenses', element: <Licenses /> },
          { path: 'accounts', element: <Accounts /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'account', element: <AccountPage notifs={['notifEmail']} /> },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
