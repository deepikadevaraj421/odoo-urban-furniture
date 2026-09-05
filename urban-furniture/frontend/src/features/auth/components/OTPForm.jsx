import { useState, useEffect } from 'react';

const OTPForm = ({ onSubmit, onResend, loading, error, resendMessage }) => {
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (otp.length === 6) {
      onSubmit(otp);
    }
  };

  const handleResendClick = () => {
    if (canResend) {
      onResend();
      setTimer(60);
      setCanResend(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-header">
        <h2 className="auth-title">Verify OTP</h2>
        <p className="auth-subtitle">An OTP has been sent to your registered email</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {resendMessage && <div className="alert alert-success">{resendMessage}</div>}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="otp-input">Enter 6-Digit OTP</label>
          <input
            id="otp-input"
            type="text"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="123456"
            className="form-input otp-input"
            required
            autoFocus
          />
        </div>

        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="btn-primary"
        >
          {loading ? 'Verifying OTP...' : 'Verify OTP & Login'}
        </button>

        <div className="resend-container">
          {canResend ? (
            <button
              type="button"
              onClick={handleResendClick}
              className="btn-link"
            >
              Resend OTP
            </button>
          ) : (
            <span className="timer-text">Resend OTP in {timer}s</span>
          )}
        </div>
      </form>
    </div>
  );
};

export default OTPForm;
