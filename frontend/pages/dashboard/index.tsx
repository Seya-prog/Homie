import { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../src/store';
import { fetchProperties } from '../../src/store/slices/propertySlice';
import { fetchMyRentals } from '../../src/store/slices/rentalSlice';
import { fetchMyPayments } from '../../src/store/slices/paymentSlice';
import { fetchMaintenanceRequests } from '../../src/store/slices/maintenanceSlice';
import { initiateKYCVerification } from '../../src/store/slices/userSlice';
import { logout } from '../../src/store/slices/authSlice';
import jwt from 'jsonwebtoken';
import { 
  HomeIcon, 
  CurrencyDollarIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
  PlusIcon,
  EyeIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  BanknotesIcon,
  BuildingOfficeIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

// Interface for server-side props
interface DashboardProps {
  initialData: {
    properties: any[];
    rentals: any[];
    payments: any[];
    maintenanceRequests: any[];
    user: any;
  };
}

const DashboardPage: NextPage<DashboardProps> = ({ initialData }) => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { kycLoading } = useSelector((state: RootState) => state.user);
  
  // Use server-side data instead of Redux selectors
  const { properties, rentals, payments, maintenanceRequests, user } = initialData;

  // Refresh data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      router.replace(router.asPath);
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [router]);

  // No need for data fetching useEffect - data comes from SSR

  const handleKYCVerification = async () => {
    try {
      console.log('🔄 Starting KYC verification...');
      const response = await dispatch(initiateKYCVerification()).unwrap();
      console.log('✅ KYC response:', response);
      
      if (response.authorizationUrl) {
        console.log('🔗 Redirecting to:', response.authorizationUrl);
        window.location.href = response.authorizationUrl;
      } else {
        console.warn('⚠️ No authorization URL in response');
        alert('KYC verification setup incomplete. Please contact support.');
      }
    } catch (error) {
      console.error('❌ KYC initiation failed:', error);
      alert(`KYC verification failed: ${error.message || 'Unknown error'}`);
    }
  };

  const handleLogout = async () => {
    try {
      dispatch(logout());
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const formatPrice = (price: number, currency: string = 'ETB') => {
    return new Intl.NumberFormat('en-ET').format(price) + ' ' + currency;
  };

  const getKYCStatusBadge = () => {
    if (!user?.kycStatus) return null;
    
    const statusConfig = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon, text: 'Pending' },
      VERIFIED: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, text: 'Verified' },
      REJECTED: { color: 'bg-red-100 text-red-800', icon: ExclamationTriangleIcon, text: 'Rejected' },
      EXPIRED: { color: 'bg-gray-100 text-gray-800', icon: ClockIcon, text: 'Expired' }
    };

    const config = statusConfig[user.kycStatus];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </span>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  console.log('🔍 Dashboard user data:', user);
  console.log('🔍 User role:', user?.role);
  
  const isLandlord = user.role === 'LANDLORD';
  const isTenant = user.role === 'TENANT';
  
  console.log('🔍 isLandlord:', isLandlord);
  console.log('🔍 isTenant:', isTenant);

  // Calculate stats with null checks
  const totalProperties = properties?.length || 0;
  const availableProperties = properties?.filter(p => p.status === 'AVAILABLE').length || 0;
  const rentedProperties = properties?.filter(p => p.status === 'RENTED').length || 0;
  const totalRentals = Array.isArray(rentals) ? rentals.length : 0;
  const activeRentals = Array.isArray(rentals) ? rentals.filter(r => r.status === 'ACTIVE').length : 0;
  const totalPayments = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const pendingMaintenance = maintenanceRequests?.filter(r => r.status === 'PENDING').length || 0;

  return (
    <>
      <Head>
        <title>Dashboard - Homie</title>
        <meta name="description" content="Manage your properties and rentals" />
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
                <Link href="/properties" className="text-gray-700 hover:text-primary-600">
                  Browse Properties
                </Link>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <img
                      src={user.avatar || '/default-avatar.png'}
                      alt={user.firstName}
                      className="h-8 w-8 rounded-full"
                    />
                    <span className="text-gray-700">{user.firstName} {user.lastName}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center px-3 py-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Logout"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome back, {user.firstName}!
                </h1>
                <p className="mt-2 text-gray-600">
                  {isLandlord ? 'Manage your properties and tenants' : 'Track your rentals and payments'}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {getKYCStatusBadge()}
                {!user.faydaVerified && (
                  <button
                    onClick={handleKYCVerification}
                    disabled={kycLoading}
                    className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                  >
                    <ShieldCheckIcon className="h-4 w-4 mr-2" />
                    {kycLoading ? 'Initiating...' : 'Verify Identity'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* KYC Alert */}
          {!user.faydaVerified && (
            <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Identity Verification Required
                  </h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    Complete your KYC verification to access all features and build trust with other users.
                  </p>
                  <div className="mt-3">
                    <button
                      onClick={handleKYCVerification}
                      disabled={kycLoading}
                      className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded-md hover:bg-yellow-200 disabled:opacity-50"
                    >
                      {kycLoading ? 'Initiating...' : 'Verify Now'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {isLandlord ? (
              <>
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="flex items-center">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <BuildingOfficeIcon className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Properties</p>
                      <p className="text-2xl font-bold text-gray-900">{totalProperties}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <HomeIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Available</p>
                      <p className="text-2xl font-bold text-gray-900">{availableProperties}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <UserGroupIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Rented</p>
                      <p className="text-2xl font-bold text-gray-900">{rentedProperties}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <WrenchScrewdriverIcon className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Maintenance</p>
                      <p className="text-2xl font-bold text-gray-900">{pendingMaintenance}</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="flex items-center">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <HomeIcon className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">My Rentals</p>
                      <p className="text-2xl font-bold text-gray-900">{totalRentals}</p>
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
                      <p className="text-2xl font-bold text-gray-900">{activeRentals}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BanknotesIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Paid</p>
                      <p className="text-2xl font-bold text-gray-900">{formatPrice(totalPayments)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <ClockIcon className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {payments?.filter(p => p.status === 'PENDING').length || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Actions */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  {isLandlord ? (
                    <>
                      <Link
                        href="/properties/create"
                        className="flex items-center w-full px-4 py-3 text-left bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                      >
                        <PlusIcon className="h-5 w-5 text-primary-600 mr-3" />
                        <span className="font-medium text-primary-700">List New Property</span>
                      </Link>
                      <Link
                        href="/dashboard/properties"
                        className="flex items-center w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <EyeIcon className="h-5 w-5 text-gray-600 mr-3" />
                        <span className="font-medium text-gray-700">Manage Properties</span>
                      </Link>
                      <Link
                        href="/dashboard/maintenance"
                        className="flex items-center w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <WrenchScrewdriverIcon className="h-5 w-5 text-gray-600 mr-3" />
                        <span className="font-medium text-gray-700">View Maintenance</span>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/properties"
                        className="flex items-center w-full px-4 py-3 text-left bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                      >
                        <HomeIcon className="h-5 w-5 text-primary-600 mr-3" />
                        <span className="font-medium text-primary-700">Browse Properties</span>
                      </Link>
                      <Link
                        href="/dashboard/rentals"
                        className="flex items-center w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <EyeIcon className="h-5 w-5 text-gray-600 mr-3" />
                        <span className="font-medium text-gray-700">My Rentals</span>
                      </Link>
                      <Link
                        href="/dashboard/payments"
                        className="flex items-center w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <CurrencyDollarIcon className="h-5 w-5 text-gray-600 mr-3" />
                        <span className="font-medium text-gray-700">Payment History</span>
                      </Link>
                      <Link
                        href="/dashboard/maintenance/create"
                        className="flex items-center w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <WrenchScrewdriverIcon className="h-5 w-5 text-gray-600 mr-3" />
                        <span className="font-medium text-gray-700">Request Maintenance</span>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                
                {isLandlord ? (
                  <div className="space-y-4">
                    {properties.slice(0, 5).map((property) => (
                      <div key={property.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <img
                            src={property.images[0] || '/placeholder-property.jpg'}
                            alt={property.title}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                          <div className="ml-4">
                            <p className="font-medium text-gray-900">{property.title}</p>
                            <p className="text-sm text-gray-600">{property.address}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{formatPrice(property.rentAmount)}</p>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            property.status === 'AVAILABLE' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {property.status}
                          </span>
                        </div>
                      </div>
                    ))}
                    {properties.length === 0 && (
                      <div className="text-center py-8">
                        <HomeIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No properties yet</h3>
                        <p className="mt-1 text-sm text-gray-500">Get started by listing your first property.</p>
                        <div className="mt-6">
                          <Link
                            href="/properties/create"
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                          >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            List Property
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rentals.slice(0, 5).map((rental) => (
                      <div key={rental.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <img
                            src={rental.property?.images?.[0] || '/placeholder-property.jpg'}
                            alt={rental.property?.title}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                          <div className="ml-4">
                            <p className="font-medium text-gray-900">{rental.property?.title}</p>
                            <p className="text-sm text-gray-600">{rental.property?.address}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{formatPrice(rental.rentAmount)}/month</p>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            rental.status === 'ACTIVE' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {rental.status}
                          </span>
                        </div>
                      </div>
                    ))}
                    {rentals.length === 0 && (
                      <div className="text-center py-8">
                        <HomeIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No rentals yet</h3>
                        <p className="mt-1 text-sm text-gray-500">Start browsing properties to find your perfect home.</p>
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
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Server-side data fetching
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { req } = context;
  
  try {
    // Extract JWT token from cookies
    const token = req.cookies.token;
    
    if (!token) {
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      };
    }
    
    // Verify and decode JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_in_production') as any;
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      };
    }
    
    const userId = decoded?.userId || decoded?.id;
    const userRole = decoded?.role;
    
    // Debug logging
    console.log('JWT decoded:', { userId, userRole, decoded });
    
    // Base API URL - use backend service name for SSR in Docker
    const API_BASE_URL = 'http://backend:5000/api';
    
    // First, fetch user data to determine role
    const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Cookie': req.headers.cookie || '',
      },
    });
    
    if (!userResponse.ok) {
      throw new Error(`Failed to fetch user data: ${userResponse.status}`);
    }
    
    const userData = await userResponse.json();
    const actualUserRole = userData.role;
    
    console.log('SSR User data:', userData);
    console.log('SSR User role from API:', actualUserRole);
    
    // Now fetch role-specific data based on actual user role
    const roleSpecificCalls = [];
    
    if (actualUserRole === 'LANDLORD') {
      // Fetch landlord-specific data
      roleSpecificCalls.push(
        fetch(`${API_BASE_URL}/properties/my/properties`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cookie': req.headers.cookie || '',
          },
        }),
        fetch(`${API_BASE_URL}/maintenance/requests`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cookie': req.headers.cookie || '',
          },
        })
      );
    } else if (actualUserRole === 'TENANT') {
      // Fetch tenant-specific data
      roleSpecificCalls.push(
        fetch(`${API_BASE_URL}/rentals/my`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cookie': req.headers.cookie || '',
          },
        }),
        fetch(`${API_BASE_URL}/payments/my`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cookie': req.headers.cookie || '',
          },
        })
      );
    }
    
    // Execute role-specific API calls in parallel
    const roleResponses = await Promise.all(roleSpecificCalls);
    
    // Parse role-specific responses
    const roleData = await Promise.all(
      roleResponses.map(async (response) => {
        if (!response.ok) {
          console.warn(`Role-specific API call failed: ${response.status}`);
          return { data: [] }; // Return empty data instead of throwing
        }
        return response.json();
      })
    );
    
    // Combine user data with role-specific data
    const data = [userData, ...roleData];
    
    // Structure data based on user role
    console.log('SSR User data:', data[0]);
    console.log('SSR User role from JWT:', userRole);
    console.log('SSR User role from API:', actualUserRole);
    
    let initialData = {
      properties: [],
      rentals: [],
      payments: [],
      maintenanceRequests: [],
      user: userData.id ? userData : { 
        id: userId || null, 
        role: actualUserRole || null,
        firstName: null,
        lastName: null,
        email: null,
        phone: null,
        avatar: null,
        faydaVerified: false,
        kycStatus: null
      }, // Use fetched user data with proper fallbacks
    };
    
    if (actualUserRole === 'LANDLORD') {
      initialData.properties = Array.isArray(data[1]?.data) ? data[1].data : [];
      initialData.maintenanceRequests = Array.isArray(data[2]?.data) ? data[2].data : [];
    } else if (actualUserRole === 'TENANT') {
      initialData.rentals = Array.isArray(data[1]?.data) ? data[1].data : [];
      initialData.payments = Array.isArray(data[2]?.data) ? data[2].data : [];
    }
    
    return {
      props: {
        initialData,
      },
    };
    
  } catch (error) {
    console.error('Server-side data fetching error:', error);
    
    // Redirect to login if token is invalid
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
};

export default DashboardPage;