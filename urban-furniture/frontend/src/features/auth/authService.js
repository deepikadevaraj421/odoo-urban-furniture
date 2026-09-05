import authApi from '../../../services/authApi';

export const authService = {
  login: (credentials) => authApi.login(credentials),
  verifyOtp: (data) => authApi.verifyOtp(data),
  resendOtp: (data) => authApi.resendOtp(data),
  getCurrentUser: () => authApi.getMe(),
};

export default authService;
