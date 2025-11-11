import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../src/store';
import { fetchMaintenanceRequests, updateMaintenanceRequest } from '../../../src/store/slices/maintenanceSlice';
import { 
  WrenchScrewdriverIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

const MaintenanceRequestsPage: NextPage = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { requests, loading, error } = useSelector((state: RootState) => state.maintenance);

  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateData, setUpdateData] = useState({
    status: '',
    actualCost: ''
  });

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'LANDLORD') {
      router.push('/login');
      return;
    }
    dispatch(fetchMaintenanceRequests());
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
      IN_PROGRESS: { color: 'bg-blue-100 text-blue-800', icon: ArrowPathIcon },
      COMPLETED: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
      CANCELLED: { color: 'bg-red-100 text-red-800', icon: XCircleIcon }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      LOW: { color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircleIcon },
      MEDIUM: { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: ClockIcon },
      HIGH: { color: 'bg-orange-50 text-orange-700 border-orange-200', icon: ExclamationTriangleIcon },
      URGENT: { color: 'bg-red-50 text-red-700 border-red-200', icon: ExclamationTriangleIcon }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig];
    if (!config) return null;

    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded border ${config.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {priority}
      </span>
    );
  };

  const handleUpdateStatus = async () => {
    if (!selectedRequest) return;

    try {
      const data: any = {
        status: updateData.status || selectedRequest.status
      };

      if (updateData.actualCost) {
        data.actualCost = parseFloat(updateData.actualCost);
      }

      if (data.status === 'COMPLETED') {
        data.completedAt = new Date().toISOString();
      }

      await dispatch(updateMaintenanceRequest({
        id: selectedRequest.id,
        updateData: data
      })).unwrap();

      setShowUpdateModal(false);
      setSelectedRequest(null);
      setUpdateData({ status: '', actualCost: '' });
    } catch (error) {
      console.error('Failed to update maintenance request:', error);
    }
  };

  const filteredRequests = Array.isArray(requests) ? requests.filter(request => {
    if (filterStatus !== 'ALL' && request.status !== filterStatus) return false;
    if (filterPriority !== 'ALL' && request.priority !== filterPriority) return false;
    return true;
  }) : [];

  const pendingRequests = Array.isArray(requests) ? requests.filter(r => r.status === 'PENDING').length : 0;
  const inProgressRequests = Array.isArray(requests) ? requests.filter(r => r.status === 'IN_PROGRESS').length : 0;
  const completedRequests = Array.isArray(requests) ? requests.filter(r => r.status === 'COMPLETED').length : 0;

  return (
    <>
      <Head>
        <title>Maintenance Requests - Homie</title>
        <meta name="description" content="View and manage maintenance requests" />
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
            <h1 className="text-3xl font-bold text-gray-900">Maintenance Requests</h1>
            <p className="mt-2 text-gray-600">
              View and manage maintenance requests from your tenants
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <WrenchScrewdriverIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <ClockIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingRequests}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ArrowPathIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{inProgressRequests}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{completedRequests}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Urgent Requests Alert */}
          {requests.filter(r => r.priority === 'URGENT' && r.status === 'PENDING').length > 0 && (
            <div className="mb-8 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Urgent Maintenance Requests
                  </h3>
                  <p className="mt-1 text-sm text-red-700">
                    You have {requests.filter(r => r.priority === 'URGENT' && r.status === 'PENDING').length} urgent maintenance request(s) that require immediate attention.
                  </p>
                </div>
              </div>
            </div>
          )}

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
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filter by Priority
                  </label>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="ALL">All Priorities</option>
                    <option value="URGENT">Urgent</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                Showing {filteredRequests.length} of {requests.length} requests
              </div>
            </div>
          </div>

          {/* Requests List */}
          <div className="space-y-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : error ? (
              <div className="bg-white rounded-lg p-6 text-center">
                <XCircleIcon className="mx-auto h-12 w-12 text-red-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading requests</h3>
                <p className="mt-1 text-sm text-gray-500">{error}</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="bg-white rounded-lg p-6 text-center">
                <WrenchScrewdriverIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No maintenance requests found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filterStatus !== 'ALL' || filterPriority !== 'ALL'
                    ? "No requests match your filters."
                    : "No maintenance requests have been submitted yet."
                  }
                </p>
              </div>
            ) : (
              filteredRequests.map((request) => (
                <div key={request.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {request.title}
                            </h3>
                            <div className="flex items-center mt-1 text-sm text-gray-600">
                              <MapPinIcon className="h-4 w-4 mr-1" />
                              {request.property?.address || 'Property Address'}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            {getPriorityBadge(request.priority)}
                            {getStatusBadge(request.status)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 mb-4">
                      {request.description}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Requested By</p>
                        <p className="text-sm font-medium text-gray-900">
                          {request.requester?.firstName} {request.requester?.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Requested Date</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(request.createdAt)}
                        </p>
                      </div>
                      {request.estimatedCost && (
                        <div>
                          <p className="text-xs text-gray-500">Estimated Cost</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatPrice(request.estimatedCost)}
                          </p>
                        </div>
                      )}
                      {request.actualCost && (
                        <div>
                          <p className="text-xs text-gray-500">Actual Cost</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatPrice(request.actualCost)}
                          </p>
                        </div>
                      )}
                    </div>

                    {request.images && request.images.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-2">Attached Images</p>
                        <div className="flex space-x-2">
                          {request.images.slice(0, 3).map((image, index) => (
                            <img
                              key={index}
                              src={image}
                              alt={`Maintenance issue ${index + 1}`}
                              className="h-20 w-20 rounded object-cover"
                            />
                          ))}
                          {request.images.length > 3 && (
                            <div className="h-20 w-20 rounded bg-gray-100 flex items-center justify-center">
                              <span className="text-sm text-gray-600">+{request.images.length - 3}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-3">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="inline-flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View Details
                      </button>
                      {request.status !== 'COMPLETED' && request.status !== 'CANCELLED' && (
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowUpdateModal(true);
                            setUpdateData({
                              status: request.status,
                              actualCost: request.actualCost?.toString() || ''
                            });
                          }}
                          className="inline-flex items-center px-3 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700"
                        >
                          <ArrowPathIcon className="h-4 w-4 mr-1" />
                          Update Status
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Update Status Modal */}
          {showUpdateModal && selectedRequest && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Maintenance Request</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={updateData.status}
                      onChange={(e) => setUpdateData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Actual Cost (ETB)
                    </label>
                    <input
                      type="number"
                      value={updateData.actualCost}
                      onChange={(e) => setUpdateData(prev => ({ ...prev, actualCost: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter actual cost"
                    />
                  </div>
                </div>

                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={() => {
                      setShowUpdateModal(false);
                      setSelectedRequest(null);
                      setUpdateData({ status: '', actualCost: '' });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateStatus}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* View Details Modal */}
          {selectedRequest && !showUpdateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Maintenance Request Details</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <p className="text-sm text-gray-900">{selectedRequest.title}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="text-sm text-gray-900">{selectedRequest.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Priority</label>
                      <div className="mt-1">{getPriorityBadge(selectedRequest.priority)}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Property</label>
                    <p className="text-sm text-gray-900">{selectedRequest.property?.title}</p>
                    <p className="text-sm text-gray-600">{selectedRequest.property?.address}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Requested By</label>
                      <p className="text-sm text-gray-900">
                        {selectedRequest.requester?.firstName} {selectedRequest.requester?.lastName}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Request Date</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedRequest.createdAt)}</p>
                    </div>
                  </div>

                  {(selectedRequest.estimatedCost || selectedRequest.actualCost) && (
                    <div className="grid grid-cols-2 gap-4">
                      {selectedRequest.estimatedCost && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Estimated Cost</label>
                          <p className="text-sm text-gray-900">{formatPrice(selectedRequest.estimatedCost)}</p>
                        </div>
                      )}
                      {selectedRequest.actualCost && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Actual Cost</label>
                          <p className="text-sm text-gray-900">{formatPrice(selectedRequest.actualCost)}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedRequest.completedAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Completed Date</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedRequest.completedAt)}</p>
                    </div>
                  )}

                  {selectedRequest.images && selectedRequest.images.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
                      <div className="grid grid-cols-3 gap-2">
                        {selectedRequest.images.map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`Maintenance issue ${index + 1}`}
                            className="h-24 w-full rounded object-cover"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                  {selectedRequest.status !== 'COMPLETED' && selectedRequest.status !== 'CANCELLED' && (
                    <button
                      onClick={() => {
                        setShowUpdateModal(true);
                        setUpdateData({
                          status: selectedRequest.status,
                          actualCost: selectedRequest.actualCost?.toString() || ''
                        });
                      }}
                      className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                    >
                      Update Status
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

export default MaintenanceRequestsPage;
