import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../src/store';
import { createProperty } from '../../src/store/slices/propertySlice';
import { 
  PhotoIcon,
  PlusIcon,
  XMarkIcon,
  ArrowLeftIcon,
  HomeIcon
} from '@heroicons/react/24/outline';

interface PropertyFormData {
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  furnished: boolean;
  rentAmount: number;
  deposit: number;
  amenities: string[];
  features: string[];
  images: string[];
}

const CreatePropertyPage: NextPage = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.property);
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState<PropertyFormData>({
    title: '',
    description: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    propertyType: 'APARTMENT',
    bedrooms: 1,
    bathrooms: 1,
    area: 0,
    furnished: false,
    rentAmount: 0,
    deposit: 0,
    amenities: [],
    features: [],
    images: [],
  });

  const [newAmenity, setNewAmenity] = useState('');
  const [newFeature, setNewFeature] = useState('');
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'LANDLORD') {
      router.push('/login');
    }
  }, [isAuthenticated, user, router]);

  const commonAmenities = [
    'Parking', 'WiFi', 'Air Conditioning', 'Heating', 'Balcony', 'Garden',
    'Swimming Pool', 'Gym', 'Laundry', 'Security', 'Elevator', 'Furnished Kitchen'
  ];

  const commonFeatures = [
    'Hardwood Floors', 'Carpet', 'Tile Flooring', 'Walk-in Closet', 'Storage Room',
    'Fireplace', 'High Ceilings', 'Large Windows', 'Updated Kitchen', 'Modern Bathroom'
  ];

  const validateStep = (step: number) => {
    const errors: { [key: string]: string } = {};

    if (step === 1) {
      if (!formData.title.trim()) errors.title = 'Title is required';
      if (!formData.description.trim()) errors.description = 'Description is required';
      if (!formData.address.trim()) errors.address = 'Address is required';
      if (!formData.city.trim()) errors.city = 'City is required';
      if (!formData.state.trim()) errors.state = 'State is required';
    }

    if (step === 2) {
      if (formData.bedrooms < 0) errors.bedrooms = 'Bedrooms must be 0 or more';
      if (formData.bathrooms < 0) errors.bathrooms = 'Bathrooms must be 0 or more';
      if (formData.area <= 0) errors.area = 'Area must be greater than 0';
    }

    if (step === 3) {
      if (formData.rentAmount <= 0) errors.rentAmount = 'Rent amount must be greater than 0';
      if (formData.deposit < 0) errors.deposit = 'Deposit cannot be negative';
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

  const addAmenity = (amenity: string) => {
    if (amenity && !formData.amenities.includes(amenity)) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, amenity]
      }));
    }
    setNewAmenity('');
  };

  const removeAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== amenity)
    }));
  };

  const addFeature = (feature: string) => {
    if (feature && !formData.features.includes(feature)) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, feature]
      }));
    }
    setNewFeature('');
  };

  const removeFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== feature)
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImageFiles(prev => [...prev, ...files]);

      const fileUrls = files.map(file => URL.createObjectURL(file));
      setFormData(prev => ({ ...prev, images: [...prev.images, ...fileUrls] }));
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(4)) {
      return;
    }

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== 'images') { // Exclude image URLs from form data
        if (Array.isArray(value)) {
          value.forEach(item => data.append(key, item));
        } else {
          data.append(key, String(value));
        }
      }
    });

    imageFiles.forEach(file => {
      data.append('images', file);
    });

    const result = await dispatch(createProperty(data));
    if (createProperty.fulfilled.match(result)) {
      router.push(`/properties/${result.payload.id}`);
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  return (
    <>
      <Head>
        <title>List New Property - Homie</title>
        <meta name="description" content="List your property for rent" />
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
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step <= currentStep ? 'bg-primary-600 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                    {step}
                  </div>
                  {step < 4 && (
                    <div className={`w-12 h-1 ${
                      step < currentStep ? 'bg-primary-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-2">
              <span className="text-sm text-gray-600">
                Step {currentStep} of 4: {
                  currentStep === 1 ? 'Basic Information' :
                  currentStep === 2 ? 'Property Details' :
                  currentStep === 3 ? 'Pricing & Features' : 'Images & Review'
                }
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Property Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Property Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className={`w-full border ${validationErrors.title ? 'border-red-300' : 'border-gray-300'} rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500`}
                      placeholder="Beautiful 2-bedroom apartment in city center"
                    />
                    {validationErrors.title && <p className="mt-1 text-sm text-red-600">{validationErrors.title}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={4}
                      className={`w-full border ${validationErrors.description ? 'border-red-300' : 'border-gray-300'} rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500`}
                      placeholder="Describe your property, its features, and what makes it special..."
                    />
                    {validationErrors.description && <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address *
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className={`w-full border ${validationErrors.address ? 'border-red-300' : 'border-gray-300'} rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500`}
                      placeholder="Street address"
                    />
                    {validationErrors.address && <p className="mt-1 text-sm text-red-600">{validationErrors.address}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className={`w-full border ${validationErrors.city ? 'border-red-300' : 'border-gray-300'} rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500`}
                      placeholder="Addis Ababa"
                    />
                    {validationErrors.city && <p className="mt-1 text-sm text-red-600">{validationErrors.city}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State/Region *
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className={`w-full border ${validationErrors.state ? 'border-red-300' : 'border-gray-300'} rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500`}
                      placeholder="Addis Ababa"
                    />
                    {validationErrors.state && <p className="mt-1 text-sm text-red-600">{validationErrors.state}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Zip Code
                    </label>
                    <input
                      type="text"
                      value={formData.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="1000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Property Type *
                    </label>
                    <select
                      value={formData.propertyType}
                      onChange={(e) => handleInputChange('propertyType', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="APARTMENT">Apartment</option>
                      <option value="HOUSE">House</option>
                      <option value="CONDO">Condo</option>
                      <option value="STUDIO">Studio</option>
                      <option value="ROOM">Room</option>
                      <option value="COMMERCIAL">Commercial</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Property Details */}
            {currentStep === 2 && (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Property Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bedrooms *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.bedrooms}
                      onChange={(e) => handleInputChange('bedrooms', parseInt(e.target.value) || 0)}
                      className={`w-full border ${validationErrors.bedrooms ? 'border-red-300' : 'border-gray-300'} rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500`}
                    />
                    {validationErrors.bedrooms && <p className="mt-1 text-sm text-red-600">{validationErrors.bedrooms}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bathrooms *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={formData.bathrooms}
                      onChange={(e) => handleInputChange('bathrooms', parseFloat(e.target.value) || 0)}
                      className={`w-full border ${validationErrors.bathrooms ? 'border-red-300' : 'border-gray-300'} rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500`}
                    />
                    {validationErrors.bathrooms && <p className="mt-1 text-sm text-red-600">{validationErrors.bathrooms}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Area (m²) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.area || ''}
                      onChange={(e) => handleInputChange('area', parseFloat(e.target.value) || 0)}
                      className={`w-full border ${validationErrors.area ? 'border-red-300' : 'border-gray-300'} rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500`}
                    />
                    {validationErrors.area && <p className="mt-1 text-sm text-red-600">{validationErrors.area}</p>}
                  </div>
                </div>

                <div className="mt-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.furnished}
                      onChange={(e) => handleInputChange('furnished', e.target.checked)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Property is furnished</span>
                  </label>
                </div>
              </div>
            )}

            {/* Step 3: Pricing & Features */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {/* Pricing */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Pricing</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Monthly Rent (ETB) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.rentAmount || ''}
                        onChange={(e) => handleInputChange('rentAmount', parseFloat(e.target.value) || 0)}
                        className={`w-full border ${validationErrors.rentAmount ? 'border-red-300' : 'border-gray-300'} rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500`}
                        placeholder="15000"
                      />
                      {validationErrors.rentAmount && <p className="mt-1 text-sm text-red-600">{validationErrors.rentAmount}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Security Deposit (ETB) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.deposit || ''}
                        onChange={(e) => handleInputChange('deposit', parseFloat(e.target.value) || 0)}
                        className={`w-full border ${validationErrors.deposit ? 'border-red-300' : 'border-gray-300'} rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500`}
                        placeholder="30000"
                      />
                      {validationErrors.deposit && <p className="mt-1 text-sm text-red-600">{validationErrors.deposit}</p>}
                    </div>
                  </div>
                </div>

                {/* Amenities */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    {commonAmenities.map((amenity) => (
                      <label key={amenity} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.amenities.includes(amenity)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              addAmenity(amenity);
                            } else {
                              removeAmenity(amenity);
                            }
                          }}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">{amenity}</span>
                      </label>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newAmenity}
                      onChange={(e) => setNewAmenity(e.target.value)}
                      placeholder="Add custom amenity"
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity(newAmenity))}
                    />
                    <button
                      type="button"
                      onClick={() => addAmenity(newAmenity)}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>

                  {formData.amenities.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Selected Amenities:</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.amenities.map((amenity) => (
                          <span
                            key={amenity}
                            className="inline-flex items-center px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full"
                          >
                            {amenity}
                            <button
                              type="button"
                              onClick={() => removeAmenity(amenity)}
                              className="ml-1 text-primary-600 hover:text-primary-800"
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Features</h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    {commonFeatures.map((feature) => (
                      <label key={feature} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.features.includes(feature)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              addFeature(feature);
                            } else {
                              removeFeature(feature);
                            }
                          }}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">{feature}</span>
                      </label>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder="Add custom feature"
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature(newFeature))}
                    />
                    <button
                      type="button"
                      onClick={() => addFeature(newFeature)}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>

                  {formData.features.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Selected Features:</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.features.map((feature) => (
                          <span
                            key={feature}
                            className="inline-flex items-center px-2 py-1 bg-primary-100 text-primary-800 text-xs rounded-full"
                          >
                            {feature}
                            <button
                              type="button"
                              onClick={() => removeFeature(feature)}
                              className="ml-1 text-primary-600 hover:text-primary-800"
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Images & Review */}
            {currentStep === 4 && (
              <div className="space-y-6">
                {/* Image Upload */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Property Images</h2>
                  
                  <div>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      multiple
                      className="sr-only"
                      onChange={handleImageChange}
                      accept="image/*"
                    />
                    <label htmlFor="file-upload" className="relative cursor-pointer">
                      <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                          <p className="text-sm text-gray-600">
                            <span className="font-semibold text-primary-600">Upload files</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Image Previews */}
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.images.map((url, index) => (
                      <div key={index} className="relative group">
                        <img src={url} alt={`Property image ${index + 1}`} className="h-32 w-full object-cover rounded-md shadow-sm" />
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                          <button type="button" onClick={() => removeImage(index)} className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100">
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Review */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Review Your Listing</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-gray-900">{formData.title}</h3>
                      <p className="text-sm text-gray-600">{formData.address}, {formData.city}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Type:</span>
                        <p className="font-medium">{formData.propertyType}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Bedrooms:</span>
                        <p className="font-medium">{formData.bedrooms}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Bathrooms:</span>
                        <p className="font-medium">{formData.bathrooms}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Area:</span>
                        <p className="font-medium">{formData.area} m²</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Monthly Rent:</span>
                        <p className="font-medium">{formData.rentAmount.toLocaleString()} ETB</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Security Deposit:</span>
                        <p className="font-medium">{formData.deposit.toLocaleString()} ETB</p>
                      </div>
                    </div>

                    <div>
                      <span className="text-gray-600">Description:</span>
                      <p className="mt-1 text-sm">{formData.description}</p>
                    </div>

                    {formData.amenities.length > 0 && (
                      <div>
                        <span className="text-gray-600">Amenities:</span>
                        <p className="mt-1 text-sm">{formData.amenities.join(', ')}</p>
                      </div>
                    )}

                    {formData.features.length > 0 && (
                      <div>
                        <span className="text-gray-600">Features:</span>
                        <p className="mt-1 text-sm">{formData.features.join(', ')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating...' : 'Create Listing'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreatePropertyPage;