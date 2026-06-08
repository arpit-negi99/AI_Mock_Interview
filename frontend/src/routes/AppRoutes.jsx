import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { RoleBasedRoute } from '@/components/common/RoleBasedRoute';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Loader } from '@/components/ui/Loader';
import { ROLES } from '@/constants/roles';
import { ROUTES } from '@/constants/routes';

const Home = lazy(() => import('@/pages/public/Home.jsx'));
const About = lazy(() => import('@/pages/public/About.jsx'));
const Features = lazy(() => import('@/pages/public/Features.jsx'));
const NotFound = lazy(() => import('@/pages/public/NotFound.jsx'));
const Login = lazy(() => import('@/pages/auth/Login.jsx'));
const Register = lazy(() => import('@/pages/auth/Register.jsx'));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword.jsx'));
const CandidateDashboard = lazy(() => import('@/pages/candidate/CandidateDashboard.jsx'));
const ProfileSetup = lazy(() => import('@/pages/candidate/ProfileSetup.jsx'));
const InterviewConfiguration = lazy(() => import('@/pages/candidate/InterviewConfiguration.jsx'));
const InterviewSession = lazy(() => import('@/pages/interview/InterviewSession.jsx'));
const ResumeUpload = lazy(() => import('@/pages/interview/ResumeUpload.jsx'));
const EvaluationResult = lazy(() => import('@/pages/results/EvaluationResult.jsx'));
const FeedbackReport = lazy(() => import('@/pages/results/FeedbackReport.jsx'));
const PracticePlan = lazy(() => import('@/pages/candidate/PracticePlan.jsx'));
const Notifications = lazy(() => import('@/pages/candidate/Notifications.jsx'));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard.jsx'));
const QuestionBank = lazy(() => import('@/pages/admin/QuestionBank.jsx'));
const AddQuestion = lazy(() => import('@/pages/admin/AddQuestion.jsx'));
const ManageRubrics = lazy(() => import('@/pages/admin/ManageRubrics.jsx'));
const UserReports = lazy(() => import('@/pages/admin/UserReports.jsx'));
const AuditLogs = lazy(() => import('@/pages/admin/AuditLogs.jsx'));

export default function AppRoutes() {
  return (
    <Suspense fallback={<Loader label="Loading page" />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path={ROUTES.HOME} element={<Home />} />
          <Route path={ROUTES.ABOUT} element={<About />} />
          <Route path={ROUTES.FEATURES} element={<Features />} />
        </Route>

        <Route element={<AuthLayout />}>
          <Route path={ROUTES.LOGIN} element={<Login />} />
          <Route path={ROUTES.REGISTER} element={<Register />} />
          <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<RoleBasedRoute allowedRoles={[ROLES.CANDIDATE]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/candidate" element={<Navigate to={ROUTES.CANDIDATE_DASHBOARD} replace />} />
              <Route path={ROUTES.CANDIDATE_DASHBOARD} element={<CandidateDashboard />} />
              <Route path={ROUTES.PROFILE_SETUP} element={<ProfileSetup />} />
              <Route path={ROUTES.INTERVIEW_CONFIGURATION} element={<InterviewConfiguration />} />
              <Route path={ROUTES.INTERVIEW_SESSION} element={<InterviewSession />} />
              <Route path={ROUTES.RESUME_UPLOAD} element={<ResumeUpload />} />
              <Route path={ROUTES.EVALUATION_RESULT} element={<EvaluationResult />} />
              <Route path={ROUTES.FEEDBACK_REPORT} element={<FeedbackReport />} />
              <Route path={ROUTES.PRACTICE_PLAN} element={<PracticePlan />} />
              <Route path={ROUTES.NOTIFICATIONS} element={<Notifications />} />
            </Route>
          </Route>

          <Route element={<RoleBasedRoute allowedRoles={[ROLES.ADMIN]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/admin" element={<Navigate to={ROUTES.ADMIN_DASHBOARD} replace />} />
              <Route path={ROUTES.ADMIN_DASHBOARD} element={<AdminDashboard />} />
              <Route path={ROUTES.QUESTION_BANK} element={<QuestionBank />} />
              <Route path={ROUTES.ADD_QUESTION} element={<AddQuestion />} />
              <Route path={ROUTES.MANAGE_RUBRICS} element={<ManageRubrics />} />
              <Route path={ROUTES.USER_REPORTS} element={<UserReports />} />
              <Route path={ROUTES.AUDIT_LOGS} element={<AuditLogs />} />
            </Route>
          </Route>
        </Route>

        <Route element={<PublicLayout />}>
          <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
