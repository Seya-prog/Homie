import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../src/store';
import { fetchMyPayments, initializePayment } from '../../src/store/slices/paymentSlice';
import { 
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  CreditCardIcon,
  CalendarIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const PaymentsPage: NextPage = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { payments, isLoading, error } = useSelector((state: RootState) => state.payment);

  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('dueDate');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'TENANT') {
      router.push('/login');
      return;
    }
    dispatch(fetchMyPayments({}));
  }, [dispatch, isAuthenticated, user, router]);

  const formatPrice = (price: number, currency: string = 'ETB') => {
    return new Intl.NumberFormat('en-ET').format(price) + ' ' + currency;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon },
      COMPLETED: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
      FAILED: { color: 'bg-red-100 text-red-800', icon: XCircleIcon },
      REFUNDED: { color: 'bg-gray-100 text-gray-800', icon: ArrowDownTrayIcon }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </span>
    );
  };

  const getPaymentTypeLabel = (type: string) => {
    const labels = {
      RENT: 'Monthly Rent',
      DEPOSIT: 'Security Deposit',
      MAINTENANCE: 'Maintenance Fee',
      PENALTY: 'Late Fee'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const handlePayment = async (payment: any) => {
    console.log('🔵 Initiating payment for:', payment);
    
    if (!payment.rental) {
      console.error('❌ No rental data in payment:', payment);
      alert('Payment data is incomplete. Please refresh the page.');
      return;
    }

    try {
      console.log('📤 Sending payment request:', {
        rentalId: payment.rental.id,
        amount: payment.amount,
        paymentType: payment.paymentType
      });

      const response = await dispatch(initializePayment({
        rentalId: payment.rental.id,
        amount: payment.amount,
        paymentType: payment.paymentType,
        description: `Payment for ${payment.paymentType}`
      })).unwrap();

      console.log('✅ Payment response:', response);

      if (response.checkoutUrl) {
        console.log('🔗 Redirecting to Chapa:', response.checkoutUrl);
        window.location.href = response.checkoutUrl;
      } else {
        console.error('❌ No checkout URL in response');
        alert('Failed to get payment URL. Please try again.');
      }
    } catch (error: any) {
      console.error('❌ Payment initialization failed:', error);
      alert(`Payment failed: ${error || 'Unknown error'}`);
    }
  };

  const filteredPayments = Array.isArray(payments) ? payments.filter(payment => {
    if (filterStatus === 'ALL') return true;
    return payment.status === filterStatus;
  }) : [];

  const sortedPayments = [...filteredPayments].sort((a, b) => {
    if (sortBy === 'dueDate') {
      return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
    } else if (sortBy === 'amount') {
      return b.amount - a.amount;
    } else if (sortBy === 'status') {
      return a.status.localeCompare(b.status);
    }
    return 0;
  });

  const totalPayments = Array.isArray(payments) ? payments.reduce((sum, p) => sum + p.amount, 0) : 0;
  const pendingPayments = Array.isArray(payments) ? payments.filter(p => p.status === 'PENDING') : [];
  const completedPayments = Array.isArray(payments) ? payments.filter(p => p.status === 'COMPLETED') : [];

  return (
    <>
      <Head>
        <title>Payment History - Homie</title>
        <meta name="description" content="View and manage your rental payments" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link href="/" className="text-2xl font-bold text-primary-600">
                  Homie
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/dashboard" className="flex items-center text-gray-700 hover:text-primary-600">
                  <ArrowLeftIcon className="h-4 w-4 mr-1" />
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
            <p className="mt-2 text-gray-600">
              Track your rental payments and payment history
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Paid</p>
                  <p className="text-2xl font-bold text-gray-900">{formatPrice(totalPayments)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <ClockIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingPayments.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{completedPayments.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Payments Alert */}
          {pendingPayments.length > 0 && (
            <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <ClockIcon className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    You have {pendingPayments.length} pending payment{pendingPayments.length > 1 ? 's' : ''}
                  </h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    Complete your payments to avoid late fees and maintain good standing.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Filters and Controls */}
          <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filter by Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="ALL">All Payments</option>
                    <option value="PENDING">Pending</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="FAILED">Failed</option>
                    <option value="REFUNDED">Refunded</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort by
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="dueDate">Due Date</option>
                    <option value="amount">Amount</option>
                    <option value="status">Status</option>
                  </select>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                Showing {sortedPayments.length} of {payments.length} payments
              </div>
            </div>
          </div>

          {/* Payments List */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <XCircleIcon className="mx-auto h-12 w-12 text-red-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading payments</h3>
                <p className="mt-1 text-sm text-gray-500">{error}</p>
              </div>
            ) : sortedPayments.length === 0 ? (
              <div className="p-6 text-center">
                <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No payments found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filterStatus === 'ALL' 
                    ? "You don't have any payments yet."
                    : `No ${filterStatus.toLowerCase()} payments found.`
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Property
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {getPaymentTypeLabel(payment.paymentType)}
                            </div>
                            <div className="text-sm text-gray-500">
                              Payment ID: {payment.id.slice(0, 8)}...
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {payment.rental?.property?.title || 'Property'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {payment.rental?.property?.address}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatPrice(payment.amount, payment.currency)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(payment.dueDate)}
                          </div>
                          {payment.paidAt && (
                            <div className="text-sm text-gray-500">
                              Paid: {formatDate(payment.paidAt)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(payment.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {payment.status === 'PENDING' && (
                              <button
                                onClick={() => handlePayment(payment)}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-primary-600 hover:bg-primary-700"
                              >
                                <CreditCardIcon className="h-3 w-3 mr-1" />
                                Pay Now
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedPayment(payment)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            {payment.status === 'COMPLETED' && (
                              <button
                                onClick={() => {/* Download receipt */}}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                <DocumentTextIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Payment Details Modal */}
          {selectedPayment && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Type</label>
                    <p className="text-sm text-gray-900">{getPaymentTypeLabel(selectedPayment.paymentType)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                    <p className="text-sm text-gray-900">{formatPrice(selectedPayment.amount, selectedPayment.currency)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Due Date</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedPayment.dueDate)}</p>
                  </div>
                  
                  {selectedPayment.paidAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Paid Date</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedPayment.paidAt)}</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                  </div>
                  
                  {selectedPayment.transactionId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
                      <p className="text-sm text-gray-900 font-mono">{selectedPayment.transactionId}</p>
                    </div>
                  )}
                  
                  {selectedPayment.gateway && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Payment Gateway</label>
                      <p className="text-sm text-gray-900 capitalize">{selectedPayment.gateway}</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={() => setSelectedPayment(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                  {selectedPayment.status === 'COMPLETED' && (
                    <button
                      onClick={() => {/* Download receipt */}}
                      className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                    >
                      Download Receipt
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PaymentsPage;