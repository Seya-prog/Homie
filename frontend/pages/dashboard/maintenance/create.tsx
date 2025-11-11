import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../src/store';
import { createMaintenanceRequest } from '../../../src/store/slices/maintenanceSlice';
import { fetchMyRentals } from '../../../src/store/slices/rentalSlice';
import { 
  WrenchScrewdriverIcon,
  PhotoIcon,
  ArrowLeftIcon,
  PlusIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const CreateMaintenanceRequestPage: NextPage = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { rentals } = useSelector((state: RootState) => state.rental);
  const { loading, error } = useSelector((state: RootState) => state.maintenance);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    propertyId: '',
    estimatedCost: '',
    images: [] as string[]
  });
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'TENANT') {
      router.push('/login');
      return;
    }
    dispatch(fetchMyRentals());
  }, [dispatch, isAuthenticated, user, router]);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }

    if (!formData.propertyId) {
      errors.propertyId = 'Please select a property';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const requestData = {
        ...formData,
        estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : undefined,
        status: 'PENDING' as const,
        images: formData.images || []
      };
      await dispatch(createMaintenanceRequest(requestData)).unwrap();
      router.push('/dashboard');
    } catch (error) {
      // Error handled by Redux slice
    }
  };

  const priorityOptions = [
    { value: 'LOW', label: 'Low', color: 'text-green-600', description: 'Non-urgent, can wait a few days' },
    { value: 'MEDIUM', label: 'Medium', color: 'text-yellow-600', description: 'Should be addressed soon' },
    { value: 'HIGH', label: 'High', color: 'text-orange-600', description: 'Needs attention within 24 hours' },
    { value: 'URGENT', label: 'Urgent', color: 'text-red-600', description: 'Emergency - immediate attention required' }
  ];

  const commonIssueTemplates = [
    {
      title: 'Plumbing Issue',
      description: 'Describe the plumbing problem (e.g., leaky faucet, clogged drain, running toilet)',
      priority: 'MEDIUM'
    },
    {
      title: 'Electrical Problem',
      description: 'Describe the electrical issue (e.g., outlet not working, flickering lights, circuit breaker tripping)',
      priority: 'HIGH'
    },
    {
      title: 'Heating/Cooling Issue',
      description: 'Describe the HVAC problem (e.g., heater not working, AC not cooling, strange noises)',
      priority: 'HIGH'
    },
    {
      title: 'Appliance Repair',
      description: 'Describe the appliance issue (e.g., refrigerator not cooling, dishwasher not draining)',
      priority: 'MEDIUM'
    },
    {
      title: 'Lock/Security Issue',
      description: 'Describe the security problem (e.g., door lock broken, window latch damaged)',
      priority: 'HIGH'
    },
    {
      title: 'Pest Control',
      description: 'Describe the pest issue (e.g., insects, rodents, location where seen)',
      priority: 'MEDIUM'
    }
  ];

  const activeRentals = Array.isArray(rentals) ? rentals.filter(rental => rental.status === 'ACTIVE') : [];

  const useTemplate = (template: any) => {
    setFormData(prev => ({
      ...prev,
      title: template.title,
      description: template.description,
      priority: template.priority
    }));
  };

  return (
    <>
      <Head>
        <title>Create Maintenance Request - Homie</title>
        <meta name="description" content="Submit a maintenance request for your rental property" />
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

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Create Maintenance Request</h1>
            <p className="mt-2 text-gray-600">
              Submit a request for maintenance or repairs needed in your rental property
            </p>
          </div>

          {/* Emergency Alert */}
          <div className="mb-8 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Emergency Situations
                </h3>
                <p className="mt-1 text-sm text-red-700">
                  For emergencies like gas leaks, flooding, electrical hazards, or security breaches, 
                  contact your landlord immediately by phone. Do not rely solely on this form for urgent situations.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Property Selection */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Property *
                    </label>
                    <select
                      value={formData.propertyId}
                      onChange={(e) => handleInputChange('propertyId', e.target.value)}
                      className={`w-full border ${validationErrors.propertyId ? 'border-red-300' : 'border-gray-300'} rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500`}
                    >
                      <option value="">Select a property</option>
                      {activeRentals.map((rental) => (
                        <option key={rental.id} value={rental.propertyId}>
                          {rental.property?.title} - {rental.property?.address}
                        </option>
                      ))}
                    </select>
                    {validationErrors.propertyId && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.propertyId}</p>
                    )}
                    {activeRentals.length === 0 && (
                      <p className="mt-1 text-sm text-gray-500">
                        No active rentals found. You can only submit maintenance requests for properties you're currently renting.
                      </p>
                    )}
                  </div>
                </div>

                {/* Request Details */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Details</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Issue Title *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        className={`w-full border ${validationErrors.title ? 'border-red-300' : 'border-gray-300'} rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500`}
                        placeholder="Brief description of the issue"
                      />
                      {validationErrors.title && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.title}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Detailed Description *
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        rows={4}
                        className={`w-full border ${validationErrors.description ? 'border-red-300' : 'border-gray-300'} rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500`}
                        placeholder="Please provide detailed information about the issue, including location, when it started, and any steps you've already taken..."
                      />
                      {validationErrors.description && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority Level *
                      </label>
                      <div className="space-y-2">
                        {priorityOptions.map((option) => (
                          <label key={option.value} className="flex items-start">
                            <input
                              type="radio"
                              name="priority"
                              value={option.value}
                              checked={formData.priority === option.value}
                              onChange={(e) => handleInputChange('priority', e.target.value)}
                              className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                            />
                            <div className="ml-3">
                              <span className={`text-sm font-medium ${option.color}`}>
                                {option.label}
                              </span>
                              <p className="text-sm text-gray-600">{option.description}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estimated Cost (ETB) - Optional
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.estimatedCost}
                        onChange={(e) => handleInputChange('estimatedCost', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="If you have an estimate for the repair cost"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        If you've already gotten a quote or have an idea of the cost, you can include it here.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Image Upload */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Photos (Optional)</h3>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      Upload photos to help illustrate the issue
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 10MB each
                    </p>
                    <button
                      type="button"
                      className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                    >
                      Choose Files
                    </button>
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-red-700">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading || activeRentals.length === 0}
                    className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Templates */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Common Issues</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Click on a template to auto-fill the form
                </p>
                
                <div className="space-y-2">
                  {commonIssueTemplates.map((template, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => useTemplate(template)}
                      className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <div className="font-medium text-gray-900">{template.title}</div>
                      <div className={`text-xs ${
                        template.priority === 'LOW' ? 'text-green-600' :
                        template.priority === 'MEDIUM' ? 'text-yellow-600' :
                        template.priority === 'HIGH' ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {template.priority} Priority
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Help & Contact */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
                
                <div className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-medium text-gray-900">Emergency Contact</h4>
                    <p className="text-gray-600">
                      For urgent issues, contact your landlord directly:
                    </p>
                    <div className="mt-2 p-2 bg-red-50 rounded border">
                      <p className="text-red-800 font-medium">Emergency: Call immediately</p>
                      <p className="text-red-700">Do not wait for a response to this form</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900">Response Times</h4>
                    <ul className="mt-1 space-y-1 text-gray-600">
                      <li>• Urgent: Within 24 hours</li>
                      <li>• High: 1-2 business days</li>
                      <li>• Medium: 3-5 business days</li>
                      <li>• Low: 1-2 weeks</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900">Tips for Better Service</h4>
                    <ul className="mt-1 space-y-1 text-gray-600">
                      <li>• Be specific about the location</li>
                      <li>• Include photos if possible</li>
                      <li>• Mention any safety concerns</li>
                      <li>• Note if the issue affects multiple areas</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateMaintenanceRequestPage;