import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../src/store';
import { fetchMyRentals } from '../../src/store/slices/rentalSlice';
import { 
  HomeIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  EyeIcon,
  DocumentTextIcon,
  BanknotesIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

const RentalsPage: NextPage = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { rentals, loading, error } = useSelector((state: RootState) => state.rental);

  const [selectedRental, setSelectedRental] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'TENANT') {
      router.push('/login');
      return;
    }
    dispatch(fetchMyRentals());
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
      ACTIVE: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
      PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon },
      EXPIRED: { color: 'bg-gray-100 text-gray-800', icon: XCircleIcon },
      TERMINATED: { color: 'bg-red-100 text-red-800', icon: XCircleIcon }
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

  const filteredRentals = Array.isArray(rentals) ? rentals.filter(rental => {
    if (filterStatus === 'ALL') return true;
    return rental.status === filterStatus;
  }) : [];

  const activeRentals = Array.isArray(rentals) ? rentals.filter(r => r.status === 'ACTIVE') : [];
  const totalRent = activeRentals.reduce((sum, r) => sum + r.rentAmount, 0);

  return (
    <>
      <Head>
        <title>My Rentals - Homie</title>
        <meta name="description" content="View and manage your rental agreements" />
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
            <h1 className="text-3xl font-bold text-gray-900">My Rentals</h1>
            <p className="mt-2 text-gray-600">
              View and manage your rental agreements
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <HomeIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Rentals</p>
                  <p className="text-2xl font-bold text-gray-900">{rentals.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Rentals</p>
                  <p className="text-2xl font-bold text-gray-900">{activeRentals.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BanknotesIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Monthly Rent</p>
                  <p className="text-2xl font-bold text-gray-900">{formatPrice(totalRent)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="ALL">All Rentals</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING">Pending</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="TERMINATED">Terminated</option>
                </select>
              </div>

              <div className="text-sm text-gray-600">
                Showing {filteredRentals.length} of {rentals.length} rentals
              </div>
            </div>
          </div>

          {/* Rentals List */}
          <div className="space-y-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : error ? (
              <div className="bg-white rounded-lg p-6 text-center">
                <XCircleIcon className="mx-auto h-12 w-12 text-red-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading rentals</h3>
                <p className="mt-1 text-sm text-gray-500">{error}</p>
              </div>
            ) : filteredRentals.length === 0 ? (
              <div className="bg-white rounded-lg p-6 text-center">
                <HomeIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No rentals found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filterStatus === 'ALL' 
                    ? "You don't have any rentals yet. Browse properties to find your perfect home."
                    : `No ${filterStatus.toLowerCase()} rentals found.`
                  }
                </p>
                <div className="mt-6">
                  <Link
                    href="/properties"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <HomeIcon className="h-4 w-4 mr-2" />
                    Browse Properties
                  </Link>
                </div>
              </div>
            ) : (
              filteredRentals.map((rental) => (
                <div key={rental.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <img
                          src={rental.property?.images?.[0] || '/placeholder-property.jpg'}
                          alt={rental.property?.title}
                          className="h-24 w-24 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {rental.property?.title || 'Property'}
                              </h3>
                              <div className="flex items-center mt-1 text-sm text-gray-600">
                                <MapPinIcon className="h-4 w-4 mr-1" />
                                {rental.property?.address}
                              </div>
                            </div>
                            <div className="ml-4">
                              {getStatusBadge(rental.status)}
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-xs text-gray-500">Monthly Rent</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {formatPrice(rental.rentAmount)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Deposit</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {formatPrice(rental.deposit)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Start Date</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {formatDate(rental.startDate)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">End Date</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {formatDate(rental.endDate)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex space-x-3">
                            <button
                              onClick={() => setSelectedRental(rental)}
                              className="inline-flex items-center px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                              <EyeIcon className="h-4 w-4 mr-1" />
                              View Details
                            </button>
                            <Link
                              href={`/properties/${rental.propertyId}`}
                              className="inline-flex items-center px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                              <HomeIcon className="h-4 w-4 mr-1" />
                              View Property
                            </Link>
                            {rental.status === 'ACTIVE' && (
                              <Link
                                href="/dashboard/payments"
                                className="inline-flex items-center px-3 py-1 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700"
                              >
                                <BanknotesIcon className="h-4 w-4 mr-1" />
                                View Payments
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Rental Details Modal */}
          {selectedRental && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Rental Agreement Details</h3>
                
                <div className="space-y-4">
                  <div className="border-b pb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Property Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Property Name</label>
                        <p className="text-sm text-gray-900">{selectedRental.property?.title}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <p className="text-sm text-gray-900">{selectedRental.property?.address}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Property Type</label>
                        <p className="text-sm text-gray-900 capitalize">{selectedRental.property?.propertyType}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Bedrooms</label>
                        <p className="text-sm text-gray-900">{selectedRental.property?.bedrooms} Beds</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-b pb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Rental Terms</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Monthly Rent</label>
                        <p className="text-sm text-gray-900">{formatPrice(selectedRental.rentAmount)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Security Deposit</label>
                        <p className="text-sm text-gray-900">{formatPrice(selectedRental.deposit)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Start Date</label>
                        <p className="text-sm text-gray-900">{formatDate(selectedRental.startDate)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">End Date</label>
                        <p className="text-sm text-gray-900">{formatDate(selectedRental.endDate)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <div className="mt-1">{getStatusBadge(selectedRental.status)}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rental ID</label>
                    <p className="text-sm text-gray-900 font-mono">{selectedRental.id}</p>
                  </div>
                </div>

                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={() => setSelectedRental(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <Link
                    href={`/properties/${selectedRental.propertyId}`}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-center"
                  >
                    View Property
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default RentalsPage;
