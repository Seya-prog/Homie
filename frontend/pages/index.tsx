import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../src/store';
import { getCurrentUser } from '../src/store/slices/authSlice';
import { 
  HomeIcon, 
  ShieldCheckIcon, 
  CreditCardIcon, 
  UserGroupIcon,
  ArrowRightIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

const HomePage: NextPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isAuthenticated && !user) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, isAuthenticated, user]);

  const features = [
    {
      name: 'Digital Identity Verification',
      description: 'Secure KYC process using Fayda\'s digital ID system for verified user profiles.',
      icon: ShieldCheckIcon,
    },
    {
      name: 'Automated Rent Collection',
      description: 'Seamless payment processing with Chapa integration and recurring payments.',
      icon: CreditCardIcon,
    },
    {
      name: 'Property Management',
      description: 'Complete property portfolio management with tenant screening and maintenance tracking.',
      icon: HomeIcon,
    },
    {
      name: 'Verified Community',
      description: 'Build trust with verified landlords and tenants through our KYC process.',
      icon: UserGroupIcon,
    },
  ];

  const benefits = [
    'Reduced fraud through verified identities',
    'Streamlined property management',
    'Automated rent collection',
    'Secure payment processing',
    'Real-time maintenance tracking',
    'Comprehensive tenant screening'
  ];

  return (
    <>
      <Head>
        <title>Homie - Property Listing & Management Platform</title>
        <meta name="description" content="End-to-end property listing and rental management platform with Fayda integration for secure digital identity verification." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-white">
        {/* Navigation */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <h1 className="text-2xl font-bold text-primary-600">Homie</h1>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {isAuthenticated ? (
                  <Link href={user?.role === 'LANDLORD' ? '/dashboard' : '/properties'}>
                    <a className="btn-primary">
                      Go to Dashboard
                    </a>
                  </Link>
                ) : (
                  <>
                    <Link href="/login">
                      <a className="text-gray-700 hover:text-primary-600">Sign In</a>
                    </Link>
                    <Link href="/register">
                      <a className="btn-primary">Get Started</a>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-primary-600 to-primary-800">
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Modern Property Management
            </h1>
            <p className="mt-6 text-xl text-blue-100 max-w-3xl">
              Streamline your rental business with our comprehensive platform featuring 
              Fayda digital ID verification, automated payments, and complete property management tools.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/register">
                <a className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-gray-50 transition-colors">
                  Start Free Trial
                  <ArrowRightIcon className="ml-2 -mr-1 w-5 h-5" />
                </a>
              </Link>
              <Link href="/properties">
                <a className="inline-flex items-center px-8 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-white hover:text-primary-600 transition-colors">
                  Browse Properties
                </a>
              </Link>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">Features</h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Everything you need to manage properties
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
                Our platform combines cutting-edge technology with user-friendly design to revolutionize property management.
              </p>
            </div>

            <div className="mt-16">
              <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
                {features.map((feature) => (
                  <div key={feature.name} className="relative">
                    <dt>
                      <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                        <feature.icon className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <p className="ml-16 text-lg leading-6 font-medium text-gray-900">{feature.name}</p>
                    </dt>
                    <dd className="mt-2 ml-16 text-base text-gray-500">{feature.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                  Why Choose Homie?
                </h2>
                <p className="mt-3 max-w-3xl text-lg text-gray-500">
                  Our platform is designed to address the key challenges in the property rental market, 
                  providing solutions that benefit both landlords and tenants.
                </p>
                <dl className="mt-10 space-y-4">
                  {benefits.map((benefit) => (
                    <div key={benefit} className="flex">
                      <div className="flex-shrink-0">
                        <CheckIcon className="h-6 w-6 text-green-500" aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                        <dt className="text-lg font-medium text-gray-900">{benefit}</dt>
                      </div>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="mt-10 lg:mt-0">
                <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg p-8">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Fayda Integration</h3>
                    <p className="text-gray-600 mb-6">
                      Secure digital identity verification powered by Ethiopia's national digital ID system
                    </p>
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <h4 className="font-semibold text-gray-900">KYC Verification</h4>
                        <p className="text-sm text-gray-600">Automated identity verification process</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <h4 className="font-semibold text-gray-900">Trust & Security</h4>
                        <p className="text-sm text-gray-600">Build confidence with verified user profiles</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <h4 className="font-semibold text-gray-900">Compliance</h4>
                        <p className="text-sm text-gray-600">Meet regulatory requirements seamlessly</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-primary-600">
          <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              <span className="block">Ready to get started?</span>
              <span className="block">Join thousands of satisfied users.</span>
            </h2>
            <p className="mt-4 text-lg leading-6 text-blue-100">
              Experience the future of property management with our comprehensive platform.
            </p>
            <Link href="/register">
              <a className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-blue-50 sm:w-auto transition-colors">
                Sign up for free
              </a>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-800">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="col-span-1 md:col-span-2">
                <h3 className="text-white text-lg font-bold mb-4">Homie</h3>
                <p className="text-gray-300 text-sm">
                  Modern property listing and management platform with secure digital identity verification.
                </p>
              </div>
              <div>
                <h4 className="text-white font-medium mb-4">Platform</h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li><Link href="/properties"><a className="hover:text-white">Browse Properties</a></Link></li>
                  <li><Link href="/register"><a className="hover:text-white">List Property</a></Link></li>
                  <li><Link href="/about"><a className="hover:text-white">About Us</a></Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-medium mb-4">Support</h4>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li><a href="#" className="hover:text-white">Help Center</a></li>
                  <li><a href="#" className="hover:text-white">Contact Us</a></li>
                  <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                </ul>
              </div>
            </div>
            <div className="mt-8 border-t border-gray-700 pt-8">
              <p className="text-center text-sm text-gray-400">
                © 2024 Homie. Built by Seid Muhidin & Abdulwahid Sultan. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default HomePage;