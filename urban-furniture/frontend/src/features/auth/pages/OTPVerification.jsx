import { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { authApi } from '../../../services/authApi';
import { ROUTES } from '../../../utils/constants';
import OTPForm from '../components/OTPForm';

const OTPVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const userId = location.state?.userId;
  const isAdminSetup = location.state?.isAdminSetup;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendMessage, setResendMessage] = useState('');

  // If no userId in state, user arrived directly -> redirect to login
  if (!userId) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  const handleVerifyOtp = async (otp) => {
    setLoading(true);
    setError('');
    setResendMessage('');

    try {
      const response = isAdminSetup
        ? await authApi.verifyAdminOtp({ userId, otp })
        : await authApi.verifyOtp({ userId, otp });
      const data = response.data;

      if (data.token && data.user) {
        login(data.token, data.user);
        navigate(data.redirectTo || ROUTES.ADMIN_DASHBOARD);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'OTP verification failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setResendMessage('');

    try {
      const response = await authApi.resendOtp({ userId });
      setResendMessage(response.data.message || 'OTP resent successfully.');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to resend OTP. Please try again.'
      );
    }
  };

  return (
    <div className="auth-page-container">
      <OTPForm
        onSubmit={handleVerifyOtp}
        onResend={handleResendOtp}
        loading={loading}
        error={error}
        resendMessage={resendMessage}
      />
    </div>
  );
};

export default OTPVerification;
