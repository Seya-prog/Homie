import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../src/store';
import { fetchPropertyById } from '../../src/store/slices/propertySlice';
import { applyForRental } from '../../src/store/slices/rentalSlice';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import { 
  MapPinIcon, 
  HomeIcon, 
  CurrencyDollarIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  UserIcon,
  CheckIcon,
  ArrowLeftIcon,
  ShareIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

// Dynamic import for Map component to avoid SSR issues with leaflet
const Map = dynamic(() => import('../../components/Map'), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-gray-200 rounded-lg flex items-center justify-center">
      <span className="text-gray-500">Loading map...</span>
    </div>
  ),
});

const PropertyDetailPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const dispatch = useDispatch<AppDispatch>();
  const { currentProperty: property, isLoading, error } = useSelector((state: RootState) => state.property);
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showRentalForm, setShowRentalForm] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: user?.firstName + ' ' + user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    message: '',
  });
  const [rentalForm, setRentalForm] = useState({
    startDate: '',
    endDate: '',
    moveInDate: '',
  });

  useEffect(() => {
    if (id && typeof id === 'string') {
      dispatch(fetchPropertyById(id));
    }
  }, [dispatch, id]);

  const formatPrice = (price: number, currency: string = 'ETB') => {
    return new Intl.NumberFormat('en-ET').format(price) + ' ' + currency;
  };

  const getPropertyTypeLabel = (type: string) => {
    const labels = {
      APARTMENT: 'Apartment',
      HOUSE: 'House',
      CONDO: 'Condo',
      STUDIO: 'Studio',
      ROOM: 'Room',
      COMMERCIAL: 'Commercial'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    // Handle contact form submission
    console.log('Contact form submitted:', contactForm);
    setShowContactForm(false);
  };

  const handleRentalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await dispatch(applyForRental({
        propertyId: property.id,
        startDate: rentalForm.startDate,
        endDate: rentalForm.endDate
      })).unwrap();
      
      setShowRentalForm(false);
      toast.success('Rental application submitted successfully! The landlord will review your application.');
      
      // Reset form
      setRentalForm({ startDate: '', endDate: '', moveInDate: '' });
    } catch (error: any) {
      toast.error(error || 'Failed to submit rental application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Property not found</h2>
          <p className="mt-2 text-gray-600">The property you're looking for doesn't exist.</p>
          <Link href="/properties" className="mt-4 inline-block btn-primary">
            Back to Properties
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{property.title} - Homie</title>
        <meta name="description" content={property.description} />
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
                <Link href="/properties" className="flex items-center text-gray-700 hover:text-primary-600">
                  <ArrowLeftIcon className="h-4 w-4 mr-1" />
                  Back to Properties
                </Link>
                {isAuthenticated && (
                  <Link href="/dashboard" className="text-gray-700 hover:text-primary-600">
                    Dashboard
                  </Link>
                )}
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Image Gallery */}
          <div className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <img
                    src={property.images[currentImageIndex] || '/placeholder-property.jpg'}
                    alt={property.title}
                    className="w-full h-96 object-cover rounded-lg"
                  />
                  <div className="absolute top-4 right-4 flex space-x-2">
                    <button
                      onClick={() => setFavorite(!favorite)}
                      className="p-2 bg-white rounded-full shadow-md hover:shadow-lg"
                    >
                      {favorite ? (
                        <HeartSolidIcon className="h-6 w-6 text-red-500" />
                      ) : (
                        <HeartIcon className="h-6 w-6 text-gray-600" />
                      )}
                    </button>
                    <button className="p-2 bg-white rounded-full shadow-md hover:shadow-lg">
                      <ShareIcon className="h-6 w-6 text-gray-600" />
                    </button>
                  </div>
                  {property.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImageIndex(prev => prev > 0 ? prev - 1 : property.images.length - 1)}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-white rounded-full shadow-md hover:shadow-lg"
                      >
                        ←
                      </button>
                      <button
                        onClick={() => setCurrentImageIndex(prev => prev < property.images.length - 1 ? prev + 1 : 0)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-white rounded-full shadow-md hover:shadow-lg"
                      >
                        →
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                {property.images.slice(1, 5).map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${property.title} ${index + 2}`}
                    className="w-full h-44 lg:h-28 object-cover rounded-lg cursor-pointer hover:opacity-80"
                    onClick={() => setCurrentImageIndex(index + 1)}
                  />
                ))}
                {property.images.length > 5 && (
                  <div className="relative">
                    <img
                      src={property.images[4]}
                      alt="More images"
                      className="w-full h-44 lg:h-28 object-cover rounded-lg cursor-pointer"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                      <span className="text-white font-medium">+{property.images.length - 4} more</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Property Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{property.title}</h1>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    property.status === 'AVAILABLE' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {property.status}
                  </span>
                </div>
                
                <div className="flex items-center text-gray-600 mb-4">
                  <MapPinIcon className="h-5 w-5 mr-2" />
                  <span>{property.address}, {property.city}, {property.state}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center">
                      <HomeIcon className="h-5 w-5 mr-1 text-gray-500" />
                      <span className="text-gray-700">{getPropertyTypeLabel(property.propertyType)}</span>
                    </div>
                    <div className="text-gray-700">{property.bedrooms} bed</div>
                    <div className="text-gray-700">{property.bathrooms} bath</div>
                    <div className="text-gray-700">{property.area} m²</div>
                  </div>
                  <div className="flex items-center text-primary-600">
                    <CurrencyDollarIcon className="h-6 w-6 mr-1" />
                    <span className="text-2xl font-bold">{formatPrice(property.rentAmount)}</span>
                    <span className="text-gray-600 ml-1">/month</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-white rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-700 leading-relaxed">{property.description}</p>
              </div>

              {/* Amenities */}
              <div className="bg-white rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {property.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center">
                      <CheckIcon className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-gray-700">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features */}
              {property.features.length > 0 && (
                <div className="bg-white rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Features</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {property.features.map((feature, index) => (
                      <div key={index} className="flex items-center">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-2" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Map */}
              <div className="bg-white rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Location</h2>
                <Map
           address={property.address}
           city={property.city}
           latitude={property.latitude}
           longitude={property.longitude}
          height="400px"
           />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Card */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Property Owner</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <UserIcon className="h-5 w-5 text-gray-500 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {property.owner?.firstName} {property.owner?.lastName}
                      </p>
                      <p className="text-sm text-gray-600">Property Owner</p>
                    </div>
                  </div>

                  {isAuthenticated && user?.role === 'TENANT' ? (
                    <div className="space-y-3">
                      <button
                        onClick={() => setShowContactForm(true)}
                        className="w-full flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                      >
                        <EnvelopeIcon className="h-5 w-5 mr-2" />
                        Send Message
                      </button>
                      
                      {property.status === 'AVAILABLE' && (
                        <button
                          onClick={() => setShowRentalForm(true)}
                          className="w-full flex items-center justify-center px-4 py-2 border border-primary-600 text-primary-600 rounded-md hover:bg-primary-50"
                        >
                          <CalendarIcon className="h-5 w-5 mr-2" />
                          Apply to Rent
                        </button>
                      )}
                    </div>
                  ) : !isAuthenticated ? (
                    <div className="space-y-3">
                      <Link
                        href="/login"
                        className="w-full flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                      >
                        Sign In to Contact
                      </Link>
                      <p className="text-sm text-gray-600 text-center">
                        <Link href="/register" className="text-primary-600 hover:underline">
                          Create an account
                        </Link>{' '}
                        to contact the owner
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      Only tenants can contact property owners
                    </p>
                  )}
                </div>
              </div>

              {/* Property Details Summary */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Rent</span>
                    <span className="font-medium">{formatPrice(property.rentAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Security Deposit</span>
                    <span className="font-medium">{formatPrice(property.deposit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Property Type</span>
                    <span className="font-medium">{getPropertyTypeLabel(property.propertyType)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Furnished</span>
                    <span className="font-medium">{property.furnished ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Area</span>
                    <span className="font-medium">{property.area} m²</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form Modal */}
        {showContactForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Property Owner</h3>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={contactForm.name}
                    onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Message</label>
                  <textarea
                    value={contactForm.message}
                    onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                    rows={4}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="I'm interested in this property..."
                    required
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowContactForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    Send Message
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Rental Application Modal */}
        {showRentalForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Apply for Rental</h3>
              <form onSubmit={handleRentalSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Lease Start Date</label>
                  <input
                    type="date"
                    value={rentalForm.startDate}
                    onChange={(e) => setRentalForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Lease End Date</label>
                  <input
                    type="date"
                    value={rentalForm.endDate}
                    onChange={(e) => setRentalForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex justify-between text-sm">
                    <span>Monthly Rent:</span>
                    <span className="font-medium">{formatPrice(property.rentAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Security Deposit:</span>
                    <span className="font-medium">{formatPrice(property.deposit)}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-medium">
                      <span>Total Due at Signing:</span>
                      <span>{formatPrice(property.rentAmount + property.deposit)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowRentalForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      'Submit Application'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PropertyDetailPage;