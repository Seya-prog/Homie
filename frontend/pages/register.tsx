import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../src/store';
import { register } from '../src/store/slices/authSlice';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  UserIcon, 
  HomeIcon,
  CheckIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
  XMarkIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface DocumentFile {
  id: string;
  file: File;
  type: 'property_ownership' | 'id_document' | 'business_license';
  name: string;
  size: number;
}

const RegisterPage: NextPage = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'TENANT' as 'TENANT' | 'LANDLORD',
  });
  
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [governmentAgreementAccepted, setGovernmentAgreementAccepted] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    if (!formData.phone) {
      errors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s-()]+$/.test(formData.phone)) {
      errors.phone = 'Phone number is invalid';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (formData.role === 'LANDLORD') {
      if (documents.length === 0) {
        errors.documents = 'At least one property ownership document is required for landlords';
      }
      if (!governmentAgreementAccepted) {
        errors.agreement = 'You must accept the government rental agreement';
      }
    }

    if (!agreedToTerms) {
      errors.terms = 'You must agree to the terms and conditions';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, documentType: DocumentFile['type']) => {
    const files = e.target.files;
    if (files) {
      const newDocuments: DocumentFile[] = Array.from(files).map(file => ({
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Create plain JavaScript object for user registration data
      const { confirmPassword, ...submitData } = formData;
      await dispatch(register(submitData)).unwrap();
      router.push('/login?registered=true');
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  const nextStep = () => {
    if (currentStep === 1) {
      // Validate basic info before proceeding
      const basicErrors: { [key: string]: string } = {};
      if (!formData.firstName.trim()) basicErrors.firstName = 'Required';
      if (!formData.lastName.trim()) basicErrors.lastName = 'Required';
      if (!formData.email) basicErrors.email = 'Required';
      if (!formData.phone) basicErrors.phone = 'Required';
      
      setValidationErrors(basicErrors);
      if (Object.keys(basicErrors).length === 0) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2 && formData.role === 'LANDLORD') {
      setCurrentStep(3);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(Math.max(1, currentStep - 1));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDocumentTypeLabel = (type: DocumentFile['type']) => {
    const labels = {
      property_ownership: 'Property Ownership Document',
      id_document: 'National ID / Passport',
      business_license: 'Business License (Optional)'
    };
    return labels[type];
  };

  const documentTypes = [
    { type: 'property_ownership' as const, label: 'Property Ownership Document', required: true, icon: '🏠', description: 'Proof of property ownership (deed, title, etc.)' },
    { type: 'id_document' as const, label: 'National ID / Passport', required: true, icon: '🆔', description: 'Government-issued identification' },
    { type: 'business_license' as const, label: 'Business License', required: false, icon: '📄', description: 'Business registration (if applicable)' }
  ];

  const steps = [
    { id: 1, name: 'Personal Info', icon: UserIcon },
    { id: 2, name: 'Account Setup', icon: ShieldCheckIcon },
    ...(formData.role === 'LANDLORD' ? [{ id: 3, name: 'Documents', icon: DocumentTextIcon }] : []),
    { id: formData.role === 'LANDLORD' ? 4 : 3, name: 'Agreement', icon: CheckIcon }
  ];

  return (
    <>
      <Head>
        <title>Join Homie - Create Your Account | Ethiopia's Premier Property Platform</title>
        <meta name="description" content="Create your account on Homie and start buying, selling, or renting properties in Ethiopia with verified users." />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-blue-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <Link href="/" className="inline-flex items-center space-x-2 hover-lift">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                <HomeIcon className="h-8 w-8 text-white" />
              </div>
              <span className="text-3xl font-bold text-gradient">Homie</span>
            </Link>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Create Your Account
            </h2>
            <p className="mt-2 text-gray-600">
              Join Ethiopia's most trusted property platform
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-center">
            <nav className="flex space-x-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                    currentStep >= step.id
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'border-gray-300 text-gray-400'
                  }`}>
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    currentStep >= step.id ? 'text-primary-600' : 'text-gray-400'
                  }`}>
                    {step.name}
                  </span>
                  {index < steps.length - 1 && (
                    <ArrowRightIcon className="h-4 w-4 text-gray-300 mx-4" />
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Main Form */}
          <div className="card-modern max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Personal Information */}
              {currentStep === 1 && (
                <div className="space-y-6 fade-in">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">Personal Information</h3>
                    <p className="text-gray-600">Tell us about yourself</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label htmlFor="firstName" className="form-label">
                        First Name *
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`form-input ${validationErrors.firstName ? 'input-error' : ''}`}
                        placeholder="Enter your first name"
                      />
                      {validationErrors.firstName && (
                        <p className="form-error">{validationErrors.firstName}</p>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="lastName" className="form-label">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`form-input ${validationErrors.lastName ? 'input-error' : ''}`}
                        placeholder="Enter your last name"
                      />
                      {validationErrors.lastName && (
                        <p className="form-error">{validationErrors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="email" className="form-label">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`form-input ${validationErrors.email ? 'input-error' : ''}`}
                      placeholder="Enter your email address"
                    />
                    {validationErrors.email && (
                      <p className="form-error">{validationErrors.email}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone" className="form-label">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`form-input ${validationErrors.phone ? 'input-error' : ''}`}
                      placeholder="+251 9XX XXX XXX"
                    />
                    {validationErrors.phone && (
                      <p className="form-error">{validationErrors.phone}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="role" className="form-label">
                      Account Type *
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <label className={`cursor-pointer border-2 rounded-xl p-4 transition-all duration-200 ${
                        formData.role === 'TENANT' 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name="role"
                          value="TENANT"
                          checked={formData.role === 'TENANT'}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div className="text-center">
                          <UserIcon className="h-8 w-8 mx-auto mb-2 text-primary-600" />
                          <div className="font-medium text-gray-900">Tenant</div>
                          <div className="text-sm text-gray-600">Looking for properties to rent</div>
                        </div>
                      </label>

                      <label className={`cursor-pointer border-2 rounded-xl p-4 transition-all duration-200 ${
                        formData.role === 'LANDLORD' 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name="role"
                          value="LANDLORD"
                          checked={formData.role === 'LANDLORD'}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div className="text-center">
                          <HomeIcon className="h-8 w-8 mx-auto mb-2 text-primary-600" />
                          <div className="font-medium text-gray-900">Landlord</div>
                          <div className="text-sm text-gray-600">Listing properties for rent/sale</div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Account Setup */}
              {currentStep === 2 && (
                <div className="space-y-6 fade-in">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">Account Security</h3>
                    <p className="text-gray-600">Create a secure password</p>
                  </div>

                  <div className="form-group">
                    <label htmlFor="password" className="form-label">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`form-input pr-10 ${validationErrors.password ? 'input-error' : ''}`}
                        placeholder="Enter a strong password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {validationErrors.password && (
                      <p className="form-error">{validationErrors.password}</p>
                    )}
                    <p className="form-help">Password must be at least 8 characters long</p>
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword" className="form-label">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`form-input pr-10 ${validationErrors.confirmPassword ? 'input-error' : ''}`}
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showConfirmPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {validationErrors.confirmPassword && (
                      <p className="form-error">{validationErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Document Upload (Landlords only) */}
              {currentStep === 3 && formData.role === 'LANDLORD' && (
                <div className="space-y-6 fade-in">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">Document Verification</h3>
                    <p className="text-gray-600">Upload required documents to verify your landlord status</p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <ExclamationTriangleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium">Required for Landlord Verification</p>
                        <p>These documents will be reviewed by our team to verify your property ownership and ensure platform security.</p>
                      </div>
                    </div>
                  </div>

                  {documentTypes.map((docType) => (
                    <div key={docType.type} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{docType.icon}</span>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {docType.label}
                              {docType.required && <span className="text-red-500 ml-1">*</span>}
                            </h4>
                            <p className="text-sm text-gray-600">{docType.description}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <input
                          type="file"
                          id={`file-${docType.type}`}
                          onChange={(e) => handleFileUpload(e, docType.type)}
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          multiple
                        />
                        <label
                          htmlFor={`file-${docType.type}`}
                          className="cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary-400 hover:bg-primary-50 transition-colors flex flex-col items-center justify-center"
                        >
                          <CloudArrowUpIcon className="h-8 w-8 text-gray-400 mb-2" />
                          <span className="text-sm font-medium text-gray-700">
                            Click to upload {docType.label.toLowerCase()}
                          </span>
                          <span className="text-xs text-gray-500">PDF, JPG, PNG, DOC (max 5MB)</span>
                        </label>

                        {/* Display uploaded files for this type */}
                        {documents.filter(doc => doc.type === docType.type).map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center space-x-3">
                              <DocumentTextIcon className="h-5 w-5 text-gray-500" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                                <p className="text-xs text-gray-500">{formatFileSize(doc.size)}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeDocument(doc.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {validationErrors.documents && (
                    <p className="form-error">{validationErrors.documents}</p>
                  )}
                </div>
              )}

              {/* Final Step: Agreement */}
              {currentStep === (formData.role === 'LANDLORD' ? 4 : 3) && (
                <div className="space-y-6 fade-in">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">Terms & Agreement</h3>
                    <p className="text-gray-600">Review and accept our terms</p>
                  </div>

                  {formData.role === 'LANDLORD' && (
                    <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                      <h4 className="font-medium text-gray-900 mb-4">Government Rental Agreement</h4>
                      <div className="max-h-60 overflow-y-auto bg-white border rounded p-4 text-sm text-gray-700 custom-scrollbar">
                        <h5 className="font-medium mb-2">የኪራይ ቤት ስምምነት (Rental Agreement)</h5>
                        <p className="mb-4">
                          This is the standard government rental agreement template that applies to all rental properties in Ethiopia.
                          By accepting this agreement, you acknowledge that all rental transactions through this platform will be governed by these terms.
                        </p>
                        <div className="space-y-2">
                          <p><strong>1. Property Standards:</strong> All rental properties must meet minimum safety and habitability standards.</p>
                          <p><strong>2. Rent Control:</strong> Rent increases are limited to government-approved rates.</p>
                          <p><strong>3. Security Deposits:</strong> Maximum security deposit is equivalent to 3 months' rent.</p>
                          <p><strong>4. Tenant Rights:</strong> Tenants have the right to peaceful enjoyment and proper notice for inspections.</p>
                          <p><strong>5. Landlord Obligations:</strong> Landlords must maintain the property and provide essential services.</p>
                          <p><strong>6. Dispute Resolution:</strong> All disputes will be resolved through local housing authorities.</p>
                          <p><strong>7. Contract Terms:</strong> Minimum lease term is 1 year unless otherwise agreed.</p>
                          <p><strong>8. Termination:</strong> Both parties must provide 30 days written notice for termination.</p>
                        </div>
                      </div>
                      <label className="flex items-start space-x-3 mt-4">
                        <input
                          type="checkbox"
                          checked={governmentAgreementAccepted}
                          onChange={(e) => setGovernmentAgreementAccepted(e.target.checked)}
                          className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">
                          I accept the government rental agreement and agree to comply with all applicable laws and regulations
                          <span className="text-red-500 ml-1">*</span>
                        </span>
                      </label>
                      {validationErrors.agreement && (
                        <p className="form-error mt-2">{validationErrors.agreement}</p>
                      )}
                    </div>
                  )}

                  <div className="border border-gray-200 rounded-lg p-6">
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">
                        I agree to the{' '}
                        <Link href="/terms" className="text-primary-600 hover:text-primary-700 font-medium">
                          Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link href="/privacy" className="text-primary-600 hover:text-primary-700 font-medium">
                          Privacy Policy
                        </Link>
                        <span className="text-red-500 ml-1">*</span>
                      </span>
                    </label>
                    {validationErrors.terms && (
                      <p className="form-error mt-2">{validationErrors.terms}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-3" />
                    <span className="text-red-800 text-sm">{error}</span>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
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
                  {currentStep < (formData.role === 'LANDLORD' ? 4 : 3) ? (
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
                      disabled={isLoading}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <div className="loading-spinner w-5 h-5 mr-2" />
                      ) : (
                        <CheckIcon className="h-5 w-5 mr-2" />
                      )}
                      {isLoading ? 'Creating Account...' : 'Create Account'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterPage;