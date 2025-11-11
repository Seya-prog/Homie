import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../src/store';
import { fetchPropertyById } from '../../../src/store/slices/propertySlice';
import { 
  ArrowLeftIcon,
  HomeIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  StarIcon,
  ShieldCheckIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface TenantDocument {
  id: string;
  file: File;
  type: 'id_document' | 'income_proof' | 'employment_letter' | 'bank_statement' | 'references';
  name: string;
  size: number;
}

const PropertyApplicationPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const dispatch = useDispatch<AppDispatch>();
  const { currentProperty, isLoading } = useSelector((state: RootState) => state.property);
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [currentStep, setCurrentStep] = useState(1);
  const [applicationData, setApplicationData] = useState({
    message: '',
    moveInDate: '',
    leaseDuration: 12,
    monthlyRent: 0,
    securityDeposit: 0,
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    monthlyIncome: '',
    occupation: '',
    employer: '',
    previousAddress: '',
    reasonForMoving: ''
  });

  const [documents, setDocuments] = useState<TenantDocument[]>([]);
  const [governmentAgreementAccepted, setGovernmentAgreementAccepted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=' + encodeURIComponent(router.asPath));
      return;
    }

    if (id && typeof id === 'string') {
      dispatch(fetchPropertyById(id));
    }
  }, [id, dispatch, isAuthenticated, router]);

  useEffect(() => {
    if (currentProperty) {
      setApplicationData(prev => ({
        ...prev,
        monthlyRent: currentProperty.rentAmount || 0,
        securityDeposit: (currentProperty.rentAmount || 0) * 2
      }));
    }
  }, [currentProperty]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setApplicationData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, documentType: TenantDocument['type']) => {
    const files = e.target.files;
    if (files) {
      const newDocuments: TenantDocument[] = Array.from(files).map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        type: documentType,
        name: file.name,
        size: file.size
      }));
      setDocuments(prev => [...prev, ...newDocuments]);
    }
  };

  const removeDocument = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  const validateStep = (step: number) => {
    const errors: { [key: string]: string } = {};

    if (step === 1) {
      if (!applicationData.message.trim()) {
        errors.message = 'Please introduce yourself and explain why you want to rent this property';
      }
      if (!applicationData.moveInDate) {
        errors.moveInDate = 'Move-in date is required';
      }
      if (applicationData.leaseDuration < 6) {
        errors.leaseDuration = 'Minimum lease duration is 6 months';
      }
    }

    if (step === 2) {
      if (!applicationData.monthlyIncome) {
        errors.monthlyIncome = 'Monthly income is required';
      }
      if (!applicationData.occupation) {
        errors.occupation = 'Occupation is required';
      }
      if (!applicationData.emergencyContactName) {
        errors.emergencyContactName = 'Emergency contact name is required';
      }
      if (!applicationData.emergencyContactPhone) {
        errors.emergencyContactPhone = 'Emergency contact phone is required';
      }
    }

    if (step === 3) {
      const requiredDocTypes = ['id_document', 'income_proof'];
      const uploadedTypes = documents.map(doc => doc.type);
      
      requiredDocTypes.forEach(type => {
        if (!uploadedTypes.includes(type as TenantDocument['type'])) {
          errors.documents = 'Required documents are missing';
        }
      });
    }

    if (step === 4) {
      if (!governmentAgreementAccepted) {
        errors.agreement = 'You must accept the government rental agreement';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(4, prev + 1));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(4)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      
      Object.keys(applicationData).forEach(key => {
        formData.append(key, applicationData[key as keyof typeof applicationData].toString());
      });
      
      formData.append('propertyId', id as string);
      formData.append('landlordId', currentProperty?.owner?.id || '');
      formData.append('governmentAgreementAccepted', governmentAgreementAccepted.toString());
      
      documents.forEach((doc, index) => {
        formData.append(`documents`, doc.file);
        formData.append(`documentTypes`, doc.type);
      });

      const response = await fetch('/api/rental-applications', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${Cookies.get('token')}`
        }
      });

      if (response.ok) {
        router.push(`/properties/${id}?applied=true`);
      } else {
        throw new Error('Failed to submit application');
      }
    } catch (error) {
      console.error('Application submission failed:', error);
      setValidationErrors({ submit: 'Failed to submit application. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-ET').format(amount) + ' ETB';
  };

  const documentTypes = [
    { 
      type: 'id_document' as const, 
      label: 'National ID / Passport', 
      required: true, 
      icon: '🆔', 
      description: 'Government-issued identification document' 
    },
    { 
      type: 'income_proof' as const, 
      label: 'Income Proof', 
      required: true, 
      icon: '💰', 
      description: 'Salary slip, bank statement, or income certificate' 
    },
    { 
      type: 'employment_letter' as const, 
      label: 'Employment Letter', 
      required: false, 
      icon: '💼', 
      description: 'Letter from your employer confirming employment' 
    },
    { 
      type: 'bank_statement' as const, 
      label: 'Bank Statement', 
      required: false, 
      icon: '🏦', 
      description: 'Recent bank statements (last 3 months)' 
    },
    { 
      type: 'references' as const, 
      label: 'References', 
      required: false, 
      icon: '👥', 
      description: 'Character references or previous landlord references' 
    }
  ];

  const steps = [
    { id: 1, name: 'Application Details', icon: DocumentTextIcon },
    { id: 2, name: 'Personal Info', icon: UserIcon },
    { id: 3, name: 'Documents', icon: CloudArrowUpIcon },
    { id: 4, name: 'Agreement', icon: CheckIcon }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="loading-spinner w-8 h-8" />
      </div>
    );
  }

  if (!currentProperty) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Property Not Found</h2>
          <p className="text-gray-600 mb-4">The property you're looking for doesn't exist.</p>
          <Link href="/properties" className="btn-primary">
            Browse Properties
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Apply for {currentProperty.title} | Homie</title>
        <meta name="description" content={`Apply to rent ${currentProperty.title} in ${currentProperty.city}, Ethiopia.`} />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-blue-50 to-purple-50">
        {/* Modern Header */}
        <div className="glass backdrop-blur-md border-b border-white/20 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href={`/properties/${id}`} className="flex items-center text-gray-600 hover:text-gray-900 transition-colors hover-lift">
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Back to Property
              </Link>
              
              <Link href="/" className="flex items-center space-x-2 hover-lift">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-lg">
                  <HomeIcon className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gradient">Homie</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Property Summary */}
            <div className="lg:col-span-1">
              <div className="card-modern sticky top-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Summary</h3>
                
                <div className="relative h-48 rounded-lg overflow-hidden mb-4">
                  <img 
                    src={currentProperty.images[0] || '/placeholder-property.jpg'}
                    alt={currentProperty.title}
                    className="w-full h-full object-cover hover-scale"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white bg-green-500 shadow-lg">
                      🏠 For Rent
                    </span>
                  </div>
                </div>

                <h4 className="font-semibold text-gray-900 mb-2">{currentProperty.title}</h4>
                <p className="text-gray-600 text-sm mb-4 flex items-center">
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  {currentProperty.address}, {currentProperty.city}
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Monthly Rent</span>
                    <span className="font-semibold text-primary-600">{formatPrice(currentProperty.rentAmount || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Security Deposit</span>
                    <span className="font-semibold">{formatPrice((currentProperty.rentAmount || 0) * 2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>🛏️ {currentProperty.bedrooms} bedrooms</span>
                    <span>🚿 {currentProperty.bathrooms} bathrooms</span>
                  </div>
                </div>

                {/* Landlord Info */}
                <div className="border-t border-gray-200 pt-4">
                  <h5 className="font-medium text-gray-900 mb-3">Property Owner</h5>
                  <div className="flex items-center space-x-3">

                    <div>
                      <p className="font-medium text-gray-900">
                        {currentProperty.owner?.firstName} {currentProperty.owner?.lastName}
                      </p>
                      {currentProperty.owner?.faydaVerified && (
                        <p className="text-xs text-green-600 flex items-center">
                          <CheckIcon className="h-3 w-3 mr-1" />
                          Verified Owner
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Application Form */}
            <div className="lg:col-span-2">
              <div className="card-modern">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Rental Application</h2>
                  <p className="text-gray-600">Complete your application to rent this property</p>
                </div>

                {/* Progress Steps */}
                <div className="flex justify-between mb-8 bg-gray-50 rounded-2xl p-4">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                        currentStep >= step.id
                          ? 'bg-gradient-to-br from-primary-600 to-blue-600 border-primary-600 text-white shadow-lg'
                          : 'border-gray-300 text-gray-400 bg-white'
                      }`}>
                        <step.icon className="h-5 w-5" />
                      </div>
                      <span className={`ml-2 text-sm font-medium hidden sm:block ${
                        currentStep >= step.id ? 'text-primary-600' : 'text-gray-400'
                      }`}>
                        {step.name}
                      </span>
                      {index < steps.length - 1 && (
                        <div className={`w-12 h-0.5 mx-4 transition-all duration-300 ${
                          currentStep > step.id ? 'bg-gradient-to-r from-primary-600 to-blue-600' : 'bg-gray-300'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Step 1: Application Details */}
                  {currentStep === 1 && (
                    <div className="space-y-6 fade-in">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <DocumentTextIcon className="h-6 w-6 mr-2 text-primary-600" />
                          Application Details
                        </h3>
                      </div>

                      <div className="form-group">
                        <label htmlFor="message" className="form-label">
                          Introduction Message *
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          value={applicationData.message}
                          onChange={handleInputChange}
                          rows={4}
                          className={`form-input ${validationErrors.message ? 'input-error' : ''}`}
                          placeholder="Introduce yourself and explain why you want to rent this property. Include your background, lifestyle, and what makes you a good tenant."
                        />
                        {validationErrors.message && (
                          <p className="form-error">{validationErrors.message}</p>
                        )}
                        <p className="form-help">This helps the landlord get to know you better</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-group">
                          <label htmlFor="moveInDate" className="form-label">
                            Preferred Move-in Date *
                          </label>
                          <input
                            type="date"
                            id="moveInDate"
                            name="moveInDate"
                            value={applicationData.moveInDate}
                            onChange={handleInputChange}
                            min={new Date().toISOString().split('T')[0]}
                            className={`form-input ${validationErrors.moveInDate ? 'input-error' : ''}`}
                          />
                          {validationErrors.moveInDate && (
                            <p className="form-error">{validationErrors.moveInDate}</p>
                          )}
                        </div>

                        <div className="form-group">
                          <label htmlFor="leaseDuration" className="form-label">
                            Lease Duration (months) *
                          </label>
                          <select
                            id="leaseDuration"
                            name="leaseDuration"
                            value={applicationData.leaseDuration}
                            onChange={handleInputChange}
                            className={`form-input ${validationErrors.leaseDuration ? 'input-error' : ''}`}
                          >
                            <option value={6}>6 months</option>
                            <option value={12}>12 months</option>
                            <option value={24}>24 months</option>
                            <option value={36}>36 months</option>
                          </select>
                          {validationErrors.leaseDuration && (
                            <p className="form-error">{validationErrors.leaseDuration}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-group">
                          <label htmlFor="monthlyRent" className="form-label">
                            Monthly Rent (ETB)
                          </label>
                          <input
                            type="number"
                            id="monthlyRent"
                            name="monthlyRent"
                            value={applicationData.monthlyRent}
                            onChange={handleInputChange}
                            className="form-input bg-gray-50"
                            readOnly
                          />
                          <p className="form-help">Fixed rent amount for this property</p>
                        </div>

                        <div className="form-group">
                          <label htmlFor="securityDeposit" className="form-label">
                            Security Deposit (ETB)
                          </label>
                          <input
                            type="number"
                            id="securityDeposit"
                            name="securityDeposit"
                            value={applicationData.securityDeposit}
                            onChange={handleInputChange}
                            className="form-input bg-gray-50"
                            readOnly
                          />
                          <p className="form-help">Refundable security deposit</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Personal Information */}
                  {currentStep === 2 && (
                    <div className="space-y-6 fade-in">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <UserIcon className="h-6 w-6 mr-2 text-primary-600" />
                          Personal Information
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-group">
                          <label htmlFor="monthlyIncome" className="form-label">
                            Monthly Income (ETB) *
                          </label>
                          <input
                            type="number"
                            id="monthlyIncome"
                            name="monthlyIncome"
                            value={applicationData.monthlyIncome}
                            onChange={handleInputChange}
                            className={`form-input ${validationErrors.monthlyIncome ? 'input-error' : ''}`}
                            placeholder="Enter your monthly income"
                          />
                          {validationErrors.monthlyIncome && (
                            <p className="form-error">{validationErrors.monthlyIncome}</p>
                          )}
                        </div>

                        <div className="form-group">
                          <label htmlFor="occupation" className="form-label">
                            Occupation *
                          </label>
                          <input
                            type="text"
                            id="occupation"
                            name="occupation"
                            value={applicationData.occupation}
                            onChange={handleInputChange}
                            className={`form-input ${validationErrors.occupation ? 'input-error' : ''}`}
                            placeholder="Your job title or profession"
                          />
                          {validationErrors.occupation && (
                            <p className="form-error">{validationErrors.occupation}</p>
                          )}
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="employer" className="form-label">
                          Employer
                        </label>
                        <input
                          type="text"
                          id="employer"
                          name="employer"
                          value={applicationData.employer}
                          onChange={handleInputChange}
                          className="form-input"
                          placeholder="Your employer or company name"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-group">
                          <label htmlFor="emergencyContactName" className="form-label">
                            Emergency Contact Name *
                          </label>
                          <input
                            type="text"
                            id="emergencyContactName"
                            name="emergencyContactName"
                            value={applicationData.emergencyContactName}
                            onChange={handleInputChange}
                            className={`form-input ${validationErrors.emergencyContactName ? 'input-error' : ''}`}
                            placeholder="Full name of emergency contact"
                          />
                          {validationErrors.emergencyContactName && (
                            <p className="form-error">{validationErrors.emergencyContactName}</p>
                          )}
                        </div>

                        <div className="form-group">
                          <label htmlFor="emergencyContactPhone" className="form-label">
                            Emergency Contact Phone *
                          </label>
                          <input
                            type="tel"
                            id="emergencyContactPhone"
                            name="emergencyContactPhone"
                            value={applicationData.emergencyContactPhone}
                            onChange={handleInputChange}
                            className={`form-input ${validationErrors.emergencyContactPhone ? 'input-error' : ''}`}
                            placeholder="+251XXXXXXXXX"
                          />
                          {validationErrors.emergencyContactPhone && (
                            <p className="form-error">{validationErrors.emergencyContactPhone}</p>
                          )}
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="emergencyContactRelationship" className="form-label">
                          Relationship to Emergency Contact
                        </label>
                        <select
                          id="emergencyContactRelationship"
                          name="emergencyContactRelationship"
                          value={applicationData.emergencyContactRelationship}
                          onChange={handleInputChange}
                          className="form-input"
                        >
                          <option value="">Select relationship</option>
                          <option value="Parent">Parent</option>
                          <option value="Sibling">Sibling</option>
                          <option value="Spouse">Spouse</option>
                          <option value="Friend">Friend</option>
                          <option value="Relative">Relative</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="previousAddress" className="form-label">
                          Previous Address
                        </label>
                        <textarea
                          id="previousAddress"
                          name="previousAddress"
                          value={applicationData.previousAddress}
                          onChange={handleInputChange}
                          rows={3}
                          className="form-input"
                          placeholder="Your current or most recent address"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="reasonForMoving" className="form-label">
                          Reason for Moving
                        </label>
                        <textarea
                          id="reasonForMoving"
                          name="reasonForMoving"
                          value={applicationData.reasonForMoving}
                          onChange={handleInputChange}
                          rows={3}
                          className="form-input"
                          placeholder="Why are you looking to move to this property?"
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 3: Documents */}
                  {currentStep === 3 && (
                    <div className="space-y-6 fade-in">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <CloudArrowUpIcon className="h-6 w-6 mr-2 text-primary-600" />
                          Document Upload
                        </h3>
                        <p className="text-gray-600 mb-6">
                          Please upload the required documents. Files should be in PDF, DOC, DOCX, JPG, or PNG format (max 5MB each).
                        </p>
                      </div>

                      {validationErrors.documents && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                          <p className="text-red-600 text-sm">{validationErrors.documents}</p>
                        </div>
                      )}

                      <div className="space-y-6">
                        {documentTypes.map((docType) => (
                          <div key={docType.type} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <span className="text-2xl">{docType.icon}</span>
                                <div>
                                  <h4 className="font-medium text-gray-900 flex items-center">
                                    {docType.label}
                                    {docType.required && (
                                      <span className="text-red-500 ml-1">*</span>
                                    )}
                                  </h4>
                                  <p className="text-sm text-gray-600">{docType.description}</p>
                                </div>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                docType.required ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {docType.required ? 'Required' : 'Optional'}
                              </span>
                            </div>

                            <div className="space-y-3">
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                multiple
                                onChange={(e) => handleFileUpload(e, docType.type)}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                              />

                              {/* Show uploaded files for this document type */}
                              {documents.filter(doc => doc.type === docType.type).length > 0 && (
                                <div className="space-y-2">
                                  {documents.filter(doc => doc.type === docType.type).map((doc) => (
                                    <div key={doc.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                      <div className="flex items-center space-x-3">
                                        <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                                        <div>
                                          <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                                          <p className="text-xs text-gray-600">{formatFileSize(doc.size)}</p>
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => removeDocument(doc.id)}
                                        className="text-red-600 hover:text-red-800 transition-colors"
                                      >
                                        <XMarkIcon className="h-5 w-5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-blue-900 mb-1">Document Requirements</h4>
                            <ul className="text-sm text-blue-800 space-y-1">
                              <li>• All documents must be clear and readable</li>
                              <li>• Files should be less than 5MB each</li>
                              <li>• Accepted formats: PDF, DOC, DOCX, JPG, PNG</li>
                              <li>• Required documents must be uploaded to proceed</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Government Agreement */}
                  {currentStep === 4 && (
                    <div className="space-y-6 fade-in">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <ShieldCheckIcon className="h-6 w-6 mr-2 text-primary-600" />
                          Government Rental Agreement
                        </h3>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <ShieldCheckIcon className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-green-900 mb-2">Official Government Rental Agreement</h4>
                            <p className="text-green-800 text-sm mb-4">
                              This is the standard rental agreement template provided by the Ethiopian Government. 
                              By accepting this agreement, you acknowledge that you understand and agree to the 
                              standard terms and conditions for residential rentals in Ethiopia.
                            </p>
                            <div className="bg-white rounded-lg p-4 border border-green-200 max-h-64 overflow-y-auto custom-scrollbar">
                              <h5 className="font-medium text-gray-900 mb-3">Key Terms Summary:</h5>
                              <ul className="text-sm text-gray-700 space-y-2">
                                <li>• Tenant rights and responsibilities</li>
                                <li>• Landlord obligations and duties</li>
                                <li>• Security deposit and rent payment terms</li>
                                <li>• Property maintenance and repair procedures</li>
                                <li>• Lease termination and renewal conditions</li>
                                <li>• Dispute resolution mechanisms</li>
                                <li>• Legal compliance with Ethiopian housing laws</li>
                              </ul>
                              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-600">
                                  <strong>Note:</strong> This is a summary. The complete agreement will be provided 
                                  upon application approval. You will have the opportunity to review the full 
                                  document before signing.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="flex items-start space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={governmentAgreementAccepted}
                            onChange={(e) => setGovernmentAgreementAccepted(e.target.checked)}
                            className="mt-1 h-5 w-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <div className="text-sm">
                            <span className="font-medium text-gray-900">
                              I accept the Government Rental Agreement *
                            </span>
                            <p className="text-gray-600 mt-1">
                              I acknowledge that I have read and understood the summary of the government rental 
                              agreement terms. I agree to be bound by the complete agreement upon approval of my 
                              application.
                            </p>
                          </div>
                        </label>

                        {validationErrors.agreement && (
                          <p className="form-error">{validationErrors.agreement}</p>
                        )}
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-yellow-900 mb-1">Important Information</h4>
                            <p className="text-sm text-yellow-800">
                              By submitting this application, you're expressing interest in renting this property. 
                              The landlord will review your application and may request additional information. 
                              Approval is not guaranteed, and the final rental agreement will be subject to 
                              negotiation between you and the landlord.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between pt-6 border-t border-gray-200">
                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={prevStep}
                        className="btn-secondary"
                      >
                        <ArrowLeftIcon className="h-5 w-5 mr-2" />
                        Previous
                      </button>
                    )}

                    <div className="ml-auto">
                      {currentStep < 4 ? (
                        <button
                          type="button"
                          onClick={nextStep}
                          className="btn-primary"
                        >
                          Next
                          <ArrowRightIcon className="h-5 w-5 ml-2" />
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? (
                            <div className="loading-spinner w-5 h-5 mr-2" />
                          ) : (
                            <CheckIcon className="h-5 w-5 mr-2" />
                          )}
                          {isSubmitting ? 'Submitting...' : 'Submit Application'}
                        </button>
                      )}
                    </div>
                  </div>

                  {validationErrors.submit && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-600 text-sm">{validationErrors.submit}</p>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PropertyApplicationPage;