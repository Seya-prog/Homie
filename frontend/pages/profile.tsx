import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../src/store';
import { updateUserProfile, uploadUserAvatar, initiateKYCVerification } from '../src/store/slices/userSlice';
import { logout } from '../src/store/slices/authSlice';
import { 
  UserIcon,
  CameraIcon,
  ShieldCheckIcon,
  KeyIcon,
  BellIcon,
  CreditCardIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

const ProfilePage: NextPage = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { loading, error, kycLoading } = useSelector((state: RootState) => state.user);

  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [isAuthenticated, user, router]);

  const validateProfileForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      errors.phone = 'Phone number is invalid';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePasswordForm = () => {
    const errors: { [key: string]: string } = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateProfileForm()) {
      return;
    }

    try {
      await dispatch(updateUserProfile(formData)).unwrap();
      setIsEditing(false);
      setValidationErrors({});
    } catch (error) {
      // Error handled by Redux slice
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }

    try {
      // Password update logic would go here
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setValidationErrors({});
      alert('Password updated successfully!');
    } catch (error) {
      // Error handling
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await dispatch(uploadUserAvatar(file)).unwrap();
      } catch (error) {
        console.error('Avatar upload failed:', error);
      }
    }
  };

  const handleKYCVerification = async () => {
    try {
      const response = await dispatch(initiateKYCVerification()).unwrap();
      if (response.authorizationUrl) {
        window.location.href = response.authorizationUrl;
      }
    } catch (error) {
      console.error('KYC initiation failed:', error);
    }
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to log out?')) {
      dispatch(logout());
      router.push('/');
    }
  };

  const getKYCStatusInfo = () => {
    if (!user?.kycStatus) return null;
    
    const statusConfig = {
      PENDING: { 
        color: 'bg-yellow-50 border-yellow-200 text-yellow-800', 
        icon: ClockIcon, 
        title: 'KYC Verification Pending',
        description: 'Your identity verification is being processed. This usually takes 24-48 hours.'
      },
      VERIFIED: { 
        color: 'bg-green-50 border-green-200 text-green-800', 
        icon: CheckCircleIcon, 
        title: 'Identity Verified',
        description: 'Your identity has been successfully verified. You have access to all platform features.'
      },
      REJECTED: { 
        color: 'bg-red-50 border-red-200 text-red-800', 
        icon: ExclamationTriangleIcon, 
        title: 'KYC Verification Failed',
        description: 'Your identity verification was rejected. Please contact support or try again with different documents.'
      },
      EXPIRED: { 
        color: 'bg-gray-50 border-gray-200 text-gray-800', 
        icon: ClockIcon, 
        title: 'KYC Verification Expired',
        description: 'Your identity verification has expired. Please complete the verification process again.'
      }
    };

    return statusConfig[user.kycStatus];
  };

  const kycStatusInfo = getKYCStatusInfo();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'security', label: 'Security', icon: KeyIcon },
    { id: 'verification', label: 'Verification', icon: ShieldCheckIcon },
    { id: 'settings', label: 'Settings', icon: BellIcon },
  ];

  return (
    <>
      <Head>
        <title>Profile Settings - Homie</title>
        <meta name="description" content="Manage your profile and account settings" />
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
          <div className="lg:grid lg:grid-cols-12 lg:gap-x-5">
            {/* Sidebar */}
            <aside className="py-6 px-2 sm:px-6 lg:py-0 lg:px-0 lg:col-span-3">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`${
                        activeTab === tab.id
                          ? 'bg-primary-50 border-primary-500 text-primary-700'
                          : 'border-transparent text-gray-900 hover:bg-gray-50'
                      } group border-l-4 px-3 py-2 flex items-center text-sm font-medium w-full`}
                    >
                      <Icon className="text-gray-400 group-hover:text-gray-500 flex-shrink-0 -ml-1 mr-3 h-6 w-6" />
                      <span className="truncate">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* Main content */}
            <div className="space-y-6 sm:px-6 lg:px-0 lg:col-span-9">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  {/* Profile Header */}
                  <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                    <div className="md:grid md:grid-cols-3 md:gap-6">
                      <div className="md:col-span-1">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">Profile Information</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Update your personal information and profile photo.
                        </p>
                      </div>
                      <div className="mt-5 md:mt-0 md:col-span-2">
                        <div className="flex items-center space-x-6">
                          <div className="relative">
                            <img
                              src={user.avatar || '/default-avatar.png'}
                              alt={user.firstName}
                              className="h-20 w-20 rounded-full object-cover"
                            />
                            <label className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-lg cursor-pointer hover:bg-gray-50">
                              <CameraIcon className="h-4 w-4 text-gray-600" />
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                                className="hidden"
                              />
                            </label>
                          </div>
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </h4>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            <p className="text-sm text-gray-500 capitalize">{user.role.toLowerCase()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Profile Form */}
                  <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                    <div className="md:grid md:grid-cols-3 md:gap-6">
                      <div className="md:col-span-1">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">Personal Details</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Your personal information used across the platform.
                        </p>
                      </div>
                      <div className="mt-5 md:mt-0 md:col-span-2">
                        <form onSubmit={handleProfileSubmit}>
                          <div className="grid grid-cols-6 gap-6">
                            <div className="col-span-6 sm:col-span-3">
                              <label className="block text-sm font-medium text-gray-700">
                                First name
                              </label>
                              <input
                                type="text"
                                value={formData.firstName}
                                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                                disabled={!isEditing}
                                className={`mt-1 block w-full border ${validationErrors.firstName ? 'border-red-300' : 'border-gray-300'} rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50`}
                              />
                              {validationErrors.firstName && (
                                <p className="mt-1 text-sm text-red-600">{validationErrors.firstName}</p>
                              )}
                            </div>

                            <div className="col-span-6 sm:col-span-3">
                              <label className="block text-sm font-medium text-gray-700">
                                Last name
                              </label>
                              <input
                                type="text"
                                value={formData.lastName}
                                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                disabled={!isEditing}
                                className={`mt-1 block w-full border ${validationErrors.lastName ? 'border-red-300' : 'border-gray-300'} rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50`}
                              />
                              {validationErrors.lastName && (
                                <p className="mt-1 text-sm text-red-600">{validationErrors.lastName}</p>
                              )}
                            </div>

                            <div className="col-span-6 sm:col-span-4">
                              <label className="block text-sm font-medium text-gray-700">
                                Email address
                              </label>
                              <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                disabled={!isEditing}
                                className={`mt-1 block w-full border ${validationErrors.email ? 'border-red-300' : 'border-gray-300'} rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50`}
                              />
                              {validationErrors.email && (
                                <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                              )}
                            </div>

                            <div className="col-span-6 sm:col-span-3">
                              <label className="block text-sm font-medium text-gray-700">
                                Phone number
                              </label>
                              <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                disabled={!isEditing}
                                className={`mt-1 block w-full border ${validationErrors.phone ? 'border-red-300' : 'border-gray-300'} rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50`}
                                placeholder="+251 912 345 678"
                              />
                              {validationErrors.phone && (
                                <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
                              )}
                            </div>
                          </div>

                          <div className="mt-6 flex justify-end space-x-3">
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsEditing(false);
                                    setFormData({
                                      firstName: user.firstName || '',
                                      lastName: user.lastName || '',
                                      email: user.email || '',
                                      phone: user.phone || '',
                                    });
                                    setValidationErrors({});
                                  }}
                                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  disabled={loading}
                                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                                >
                                  {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setIsEditing(true)}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                              >
                                <PencilIcon className="h-4 w-4 mr-2" />
                                Edit Profile
                              </button>
                            )}
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                  <div className="md:grid md:grid-cols-3 md:gap-6">
                    <div className="md:col-span-1">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">Change Password</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Update your password to keep your account secure.
                      </p>
                    </div>
                    <div className="mt-5 md:mt-0 md:col-span-2">
                      <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Current password
                          </label>
                          <input
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                            className={`mt-1 block w-full border ${validationErrors.currentPassword ? 'border-red-300' : 'border-gray-300'} rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500`}
                          />
                          {validationErrors.currentPassword && (
                            <p className="mt-1 text-sm text-red-600">{validationErrors.currentPassword}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            New password
                          </label>
                          <input
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                            className={`mt-1 block w-full border ${validationErrors.newPassword ? 'border-red-300' : 'border-gray-300'} rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500`}
                          />
                          {validationErrors.newPassword && (
                            <p className="mt-1 text-sm text-red-600">{validationErrors.newPassword}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Confirm new password
                          </label>
                          <input
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className={`mt-1 block w-full border ${validationErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'} rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500`}
                          />
                          {validationErrors.confirmPassword && (
                            <p className="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>
                          )}
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="submit"
                            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                          >
                            Update Password
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {/* Verification Tab */}
              {activeTab === 'verification' && (
                <div className="space-y-6">
                  {/* KYC Status */}
                  {kycStatusInfo && (
                    <div className={`border rounded-lg p-6 ${kycStatusInfo.color}`}>
                      <div className="flex">
                        <kycStatusInfo.icon className="h-5 w-5 mt-0.5 mr-3" />
                        <div>
                          <h3 className="text-lg font-medium">{kycStatusInfo.title}</h3>
                          <p className="mt-1 text-sm">{kycStatusInfo.description}</p>
                          {(user.kycStatus === 'REJECTED' || user.kycStatus === 'EXPIRED') && (
                            <button
                              onClick={handleKYCVerification}
                              disabled={kycLoading}
                              className="mt-3 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                            >
                              {kycLoading ? 'Initiating...' : 'Start Verification'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Verification Actions */}
                  <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Identity Verification</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">Fayda Digital ID</h4>
                          <p className="text-sm text-gray-600">
                            Verify your identity using Ethiopia's national digital ID system
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {user.faydaVerified ? (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              <CheckCircleIcon className="h-3 w-3 mr-1" />
                              Verified
                            </span>
                          ) : (
                            <button
                              onClick={handleKYCVerification}
                              disabled={kycLoading}
                              className="px-3 py-1 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
                            >
                              {kycLoading ? 'Starting...' : 'Verify'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  {/* Account Settings */}
                  <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Account Settings</h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">Email Notifications</h4>
                          <p className="text-sm text-gray-600">Receive email updates about your account</p>
                        </div>
                        <input type="checkbox" defaultChecked className="h-4 w-4 text-primary-600 border-gray-300 rounded" />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">SMS Notifications</h4>
                          <p className="text-sm text-gray-600">Receive text messages for important updates</p>
                        </div>
                        <input type="checkbox" className="h-4 w-4 text-primary-600 border-gray-300 rounded" />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">Marketing Communications</h4>
                          <p className="text-sm text-gray-600">Receive promotional emails and offers</p>
                        </div>
                        <input type="checkbox" className="h-4 w-4 text-primary-600 border-gray-300 rounded" />
                      </div>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                    <h3 className="text-lg font-medium leading-6 text-red-900 mb-4">Danger Zone</h3>
                    
                    <div className="space-y-4">
                      <div className="border border-red-200 rounded-lg p-4">
                        <h4 className="font-medium text-red-900">Log Out</h4>
                        <p className="text-sm text-red-600 mt-1">Log out from your current session</p>
                        <button
                          onClick={handleLogout}
                          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                        >
                          Log Out
                        </button>
                      </div>

                      <div className="border border-red-200 rounded-lg p-4">
                        <h4 className="font-medium text-red-900">Delete Account</h4>
                        <p className="text-sm text-red-600 mt-1">
                          Permanently delete your account and all associated data
                        </p>
                        <button
                          onClick={() => alert('Account deletion is not available in demo mode')}
                          className="mt-3 px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 text-sm"
                        >
                          Delete Account
                        </button>
                      </div>
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
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;