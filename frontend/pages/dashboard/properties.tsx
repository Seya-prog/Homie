import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../src/store';
import { fetchMyProperties, deleteProperty } from '../../src/store/slices/propertySlice';
import { fetchApplications, updateApplicationStatus } from '../../src/store/slices/rentalSlice';
import toast from 'react-hot-toast';
import { 
  HomeIcon,
  BuildingOfficeIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  MapPinIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  BellIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';

const PropertiesManagementPage: NextPage = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { properties, isLoading, error } = useSelector((state: RootState) => state.property);
  const { applications } = useSelector((state: RootState) => state.rental);

  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<any>(null);
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [selectedPropertyForApps, setSelectedPropertyForApps] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'LANDLORD') {
      router.push('/login');
      return;
    }
    dispatch(fetchMyProperties());
    dispatch(fetchApplications(undefined));
  }, [dispatch, isAuthenticated, user, router]);

  const formatPrice = (price: number, currency: string = 'ETB') => {
    return new Intl.NumberFormat('en-ET').format(price) + ' ' + currency;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      AVAILABLE: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
      RENTED: { color: 'bg-blue-100 text-blue-800', icon: ClockIcon },
      MAINTENANCE: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon },
      UNLISTED: { color: 'bg-gray-100 text-gray-800', icon: XCircleIcon }
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

  const handleDeleteProperty = async () => {
    if (!propertyToDelete) return;

    try {
      await dispatch(deleteProperty(propertyToDelete.id)).unwrap();
      setShowDeleteModal(false);
      setPropertyToDelete(null);
      toast.success('Property deleted successfully');
    } catch (error) {
      console.error('Failed to delete property:', error);
      toast.error('Failed to delete property');
    }
  };

  const handleViewApplications = (property: any) => {
    setSelectedPropertyForApps(property);
    setShowApplicationsModal(true);
  };

  const handleApproveApplication = async (applicationId: string) => {
    try {
      await dispatch(updateApplicationStatus({ id: applicationId, status: 'ACTIVE' })).unwrap();
      toast.success('Application approved! Rental agreement is now active.');
      
      // Refresh data
      await dispatch(fetchApplications(undefined));
      await dispatch(fetchMyProperties());
      
      // Close modal after successful approval
      setShowApplicationsModal(false);
      setSelectedPropertyForApps(null);
    } catch (error: any) {
      toast.error(error || 'Failed to approve application');
    }
  };

  const handleRejectApplication = async (applicationId: string) => {
    try {
      await dispatch(updateApplicationStatus({ id: applicationId, status: 'TERMINATED' })).unwrap();
      toast.success('Application rejected');
      dispatch(fetchApplications(undefined));
    } catch (error: any) {
      toast.error(error || 'Failed to reject application');
    }
  };

  const getPendingApplicationsCount = (propertyId: string) => {
    return applications.filter(app => app.propertyId === propertyId && app.status === 'PENDING').length;
  };

  const getPropertyApplications = (propertyId: string) => {
    return applications.filter(app => app.propertyId === propertyId);
  };

  const filteredProperties = Array.isArray(properties) ? properties.filter(property => {
    if (filterStatus !== 'ALL' && property.status !== filterStatus) return false;
    if (filterType !== 'ALL' && property.propertyType !== filterType) return false;
    return true;
  }) : [];

  const availableProperties = Array.isArray(properties) ? properties.filter(p => p.status === 'AVAILABLE').length : 0;
  const rentedProperties = Array.isArray(properties) ? properties.filter(p => p.status === 'RENTED').length : 0;
  const totalRevenue = Array.isArray(properties) ? properties
    .filter(p => p.status === 'RENTED')
    .reduce((sum, p) => sum + p.rentAmount, 0) : 0;

  return (
    <>
      <Head>
        <title>Manage Properties - Homie</title>
        <meta name="description" content="Manage your property listings" />
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
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Properties</h1>
              <p className="mt-2 text-gray-600">
                View, edit, and manage your property listings
              </p>
            </div>
            <Link
              href="/properties/create"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              List New Property
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Properties</p>
                  <p className="text-2xl font-bold text-gray-900">{properties.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Available</p>
                  <p className="text-2xl font-bold text-gray-900">{availableProperties}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <HomeIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Rented</p>
                  <p className="text-2xl font-bold text-gray-900">{rentedProperties}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <BuildingOfficeIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatPrice(totalRevenue)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Controls */}
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
                    <option value="ALL">All Status</option>
                    <option value="AVAILABLE">Available</option>
                    <option value="RENTED">Rented</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="UNLISTED">Unlisted</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filter by Type
                  </label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="ALL">All Types</option>
                    <option value="apartment">Apartment</option>
                    <option value="house">House</option>
                    <option value="villa">Villa</option>
                    <option value="condo">Condo</option>
                    <option value="studio">Studio</option>
                  </select>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                Showing {filteredProperties.length} of {properties.length} properties
              </div>
            </div>
          </div>

          {/* Properties Grid */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : error ? (
              <div className="bg-white rounded-lg p-6 text-center">
                <XCircleIcon className="mx-auto h-12 w-12 text-red-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading properties</h3>
                <p className="mt-1 text-sm text-gray-500">{error}</p>
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="bg-white rounded-lg p-6 text-center">
                <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No properties found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filterStatus !== 'ALL' || filterType !== 'ALL'
                    ? "No properties match your filters."
                    : "Get started by listing your first property."
                  }
                </p>
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
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProperties.map((property) => (
                  <div key={property.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="relative h-48">
                      <img
                        src={property.images?.[0] || '/placeholder-property.jpg'}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        {getStatusBadge(property.status)}
                      </div>
                      {getPendingApplicationsCount(property.id) > 0 && (
                        <div className="absolute top-2 left-2">
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                            <BellIcon className="h-3 w-3 mr-1" />
                            {getPendingApplicationsCount(property.id)} New
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {property.title}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        {property.address}
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-xs text-gray-500">Monthly Rent</p>
                          <p className="text-lg font-bold text-primary-600">
                            {formatPrice(property.rentAmount)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Type</p>
                          <p className="text-sm font-medium text-gray-900 capitalize">
                            {property.propertyType}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-4">
                        <span>{property.bedrooms} Beds</span>
                        <span>{property.bathrooms} Baths</span>
                        <span>{property.area} m²</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex space-x-2">
                          <Link
                            href={`/properties/${property.id}`}
                            className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            View
                          </Link>
                          <Link
                            href={`/properties/${property.id}/edit`}
                            className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700"
                          >
                            <PencilIcon className="h-4 w-4 mr-1" />
                            Edit
                          </Link>
                          <button
                            onClick={() => {
                              setPropertyToDelete(property);
                              setShowDeleteModal(true);
                            }}
                            className="inline-flex items-center justify-center px-3 py-2 text-sm border border-red-300 rounded-md text-red-600 bg-white hover:bg-red-50"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                        {getPropertyApplications(property.id).length > 0 && (
                          <button
                            onClick={() => handleViewApplications(property)}
                            className="w-full inline-flex items-center justify-center px-3 py-2 text-sm border border-orange-300 rounded-md text-orange-700 bg-orange-50 hover:bg-orange-100"
                          >
                            <BellIcon className="h-4 w-4 mr-1" />
                            View Applications ({getPropertyApplications(property.id).length})
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delete Confirmation Modal */}
          {showDeleteModal && propertyToDelete && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Property</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Are you sure you want to delete <strong>{propertyToDelete.title}</strong>? 
                  This action cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setPropertyToDelete(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteProperty}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Applications Modal */}
          {showApplicationsModal && selectedPropertyForApps && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b sticky top-0 bg-white flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Applications for {selectedPropertyForApps.title}
                  </h3>
                  <button
                    onClick={() => setShowApplicationsModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="p-6">
                  {getPropertyApplications(selectedPropertyForApps.id).length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No applications yet</p>
                  ) : (
                    <div className="space-y-4">
                      {getPropertyApplications(selectedPropertyForApps.id).map((app) => (
                        <div key={app.id} className="border rounded-lg p-4 hover:shadow-md transition">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                                <h4 className="text-lg font-semibold">
                                  {app.tenant?.firstName} {app.tenant?.lastName}
                                </h4>
                                {app.tenant?.faydaVerified && (
                                  <CheckCircleIcon className="h-5 w-5 text-green-500 ml-2" title="KYC Verified" />
                                )}
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                                <div className="flex items-center">
                                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                                  {app.tenant?.email}
                                </div>
                                <div className="flex items-center">
                                  <PhoneIcon className="h-4 w-4 mr-2" />
                                  {app.tenant?.phone || 'N/A'}
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-4 text-sm">
                                <span className="text-gray-600">
                                  <strong>Start:</strong> {new Date(app.startDate).toLocaleDateString()}
                                </span>
                                <span className="text-gray-600">
                                  <strong>End:</strong> {new Date(app.endDate).toLocaleDateString()}
                                </span>
                                <span className="text-gray-600">
                                  <strong>Rent:</strong> {formatPrice(app.rentAmount)}
                                </span>
                              </div>
                            </div>
                            
                            <div className="ml-4">
                              {app.status === 'PENDING' ? (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleApproveApplication(app.id)}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleRejectApplication(app.id)}
                                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                                  app.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {app.status}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
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

export default PropertiesManagementPage;
