import { useAuth } from '../../../context/AuthContext';
import PaymentsPage from './PaymentsPage';
import CustomerPaymentsPage from './CustomerPaymentsPage';
import VendorPaymentsPage from './VendorPaymentsPage';

const PaymentsRoute = () => {
  const { user } = useAuth();

  if (user?.role === 'ACCOUNTANT' && user.accountantType === 'SALES') {
    return <CustomerPaymentsPage />;
  }

  if (user?.role === 'ACCOUNTANT' && user.accountantType === 'PURCHASE') {
    return <VendorPaymentsPage />;
  }

  return <PaymentsPage />;
};

export default PaymentsRoute;
