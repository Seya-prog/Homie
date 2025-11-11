import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../src/store';
import { getCurrentUser, logout } from '../src/store/slices/authSlice';
import { useRouter } from 'next/router';
import { 
  HomeIcon, 
  ShieldCheckIcon, 
  CreditCardIcon, 
  UserGroupIcon,
  ArrowRightIcon,
  CheckIcon,
  StarIcon,
  PlayIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  ClockIcon,
  ChatBubbleLeftEllipsisIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  KeyIcon,
  ChartBarIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { 
  StarIcon as StarIconSolid,
  HeartIcon as HeartIconSolid 
} from '@heroicons/react/24/solid';

const HomePage: NextPage = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [activeTab, setActiveTab] = useState('rent');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isAuthenticated && !user) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, isAuthenticated, user]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [mounted]);

  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };

  const features = [
    {
      name: 'Digital Identity Verification',
      description: 'Secure KYC process using Fayda\'s digital ID system for complete user verification and trust.',
      icon: ShieldCheckIcon,
      color: 'from-blue-500 to-blue-600',
      emoji: '🛡️'
    },
    {
      name: 'Smart Payment Processing',
      description: 'Seamless payment processing for rent, sales, and deposits with multiple gateways and automated reminders.',
      icon: CreditCardIcon,
      color: 'from-green-500 to-green-600',
      emoji: '💳'
    },
    {
      name: 'Complete Property Solutions',
      description: 'List properties for rent or sale with AI-powered matching, virtual tours, and comprehensive analytics.',
      icon: HomeIcon,
      color: 'from-purple-500 to-purple-600',
      emoji: '🏠'
    },
    {
      name: 'Verified Community',
      description: 'Connect with verified landlords, buyers, sellers, and tenants in a trusted ecosystem.',
      icon: UserGroupIcon,
      color: 'from-orange-500 to-orange-600',
      emoji: '👥'
    },
  ];

  const stats = [
    { number: '15,000+', label: 'Active Users', icon: UserGroupIcon, emoji: '👥' },
    { number: '8,500+', label: 'Properties Listed', icon: BuildingOfficeIcon, emoji: '🏠' },
    { number: '98%', label: 'User Satisfaction', icon: StarIconSolid, emoji: '⭐' },
    { number: '24/7', label: 'Support Available', icon: ClockIcon, emoji: '🕐' },
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Property Owner',
      image: 'https://eu.ui-avatars.com/api/?name=Sarah+Johnson&size=150&background=6366f1&color=ffffff&bold=true',
      content: 'Homie transformed how I manage my rental properties. The automated rent collection and maintenance tracking saved me countless hours. I\'ve also sold 3 properties through the platform!',
      rating: 5,
      properties: 12
    },
    {
      name: 'Michael Chen',
      role: 'Home Buyer',
      image: 'https://eu.ui-avatars.com/api/?name=Michael+Chen&size=150&background=3b82f6&color=ffffff&bold=true',
      content: 'Finding and buying my dream home was incredibly easy with Homie. The verification process made me feel secure, and the platform is incredibly user-friendly.',
      rating: 5,
    },
    {
      name: 'Aisha Tadesse',
      role: 'Property Manager',
      image: 'https://eu.ui-avatars.com/api/?name=Aisha+Tadesse&size=150&background=8b5cf6&color=ffffff&bold=true',
      content: 'Managing 80+ properties for both rent and sale became effortless with Homie. The tenant screening and buyer verification features are game-changers.',
      rating: 5,
      properties: 67
    }
  ];

  const propertyTypes = [
    { name: 'Apartments', count: '3,500+', type: 'rent', icon: BuildingOfficeIcon, emoji: '🏢', color: 'from-green-500 to-green-600' },
    { name: 'Houses', count: '2,200+', type: 'rent', icon: HomeIcon, emoji: '🏠', color: 'from-blue-500 to-blue-600' },
    { name: 'Condos', count: '1,800+', type: 'sale', icon: KeyIcon, emoji: '🏙️', color: 'from-purple-500 to-purple-600' },
    { name: 'Commercial', count: '800+', type: 'sale', icon: ChartBarIcon, emoji: '🏢', color: 'from-orange-500 to-orange-600' },
  ];

  return (
    <>
      <Head>
        <title>Homie - Ethiopia's Premier Property Platform | Buy, Sell & Rent Properties</title>
        <meta name="description" content="Ethiopia's most trusted property platform for buying, selling, and renting properties. Verified users, smart matching, and seamless transactions." />
        <meta name="keywords" content="property rental, property sale, house rental, apartment sale, Ethiopia, Addis Ababa, real estate, property management" />
        <meta property="og:title" content="Homie - Buy, Sell & Rent Properties in Ethiopia" />
        <meta property="og:description" content="Ethiopia's most trusted property platform" />
        <meta property="og:image" content="/og-image.jpg" />
        <link rel="icon" href="/favicon.ico" />
      </Head>



      <div className="min-h-screen bg-white">
        {/* Modern Navigation */}
        <nav className="fixed top-0 w-full glass backdrop-blur-md z-50 border-b border-white/20 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link href="/" className="flex items-center space-x-2 hover-lift">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg hover-glow">
                    <HomeIcon className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-gradient">
                    Homie
                  </span>
                </Link>
              </div>
              
              <div className="hidden md:flex items-center space-x-8">
                <Link href="#features" className="text-gray-600 hover:text-primary-600 transition-colors font-medium relative group">
                  Features
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-600 to-blue-600 transition-all duration-300 group-hover:w-full"></span>
                </Link>
                <Link href="#how-it-works" className="text-gray-600 hover:text-primary-600 transition-colors font-medium relative group">
                  How it Works
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-600 to-blue-600 transition-all duration-300 group-hover:w-full"></span>
                </Link>
                <Link href="#testimonials" className="text-gray-600 hover:text-primary-600 transition-colors font-medium relative group">
                  Reviews
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-600 to-blue-600 transition-all duration-300 group-hover:w-full"></span>
                </Link>
                <Link href="/properties" className="text-gray-600 hover:text-primary-600 transition-colors font-medium relative group">
                  Properties
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-600 to-blue-600 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </div>

              <div className="flex items-center space-x-4">
                {mounted && isAuthenticated ? (
                  <>
                    <Link href="/dashboard" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                      Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="text-gray-700 hover:text-red-600 font-medium transition-colors"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                      Sign In
                    </Link>
                    <Link href="/register" className="btn-primary">
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Enhanced Hero Section */}
        <section className="relative pt-20 pb-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-blue-50 to-purple-50"></div>
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
              <div className="lg:col-span-6">
                <div className="text-center lg:text-left">
                  {/* Trust Badge */}
                  <div className="inline-flex items-center px-4 py-2 glass rounded-full text-sm font-medium text-primary-700 mb-6 border border-primary-200 fade-in">
                    <StarIconSolid className="h-4 w-4 text-yellow-400 mr-2" />
                    Trusted by 15,000+ users
                  </div>
                  
                  {/* Hero Title */}
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6 slide-in-up">
                    <span className="block">Buy, Sell & Rent</span>
                    <span className="block text-gradient bg-gradient-animated">Your Perfect Home</span>
                    <span className="block">in Ethiopia</span>
                  </h1>
                  
                  <p className="text-xl text-gray-600 mb-8 max-w-2xl slide-in-up" style={{animationDelay: '0.2s'}}>
                    Ethiopia's most trusted property platform with verified users, smart matching, 
                    and seamless transactions. Whether you're looking to buy, sell, or rent - 
                    your dream property is just a click away.
                  </p>

                  {/* Modern Tab Interface */}
                  <div className="flex bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-xl mb-8 max-w-md scale-in border border-white/30" style={{animationDelay: '0.4s'}}>
                    <button
                      onClick={() => setActiveTab('rent')}
                      className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                        activeTab === 'rent'
                          ? 'bg-gradient-to-r from-primary-600 to-blue-600 text-white shadow-lg scale-105'
                          : 'text-gray-600 hover:text-primary-600 hover:bg-white/50'
                      }`}
                    >
                      🏠 Rent
                    </button>
                    <button
                      onClick={() => setActiveTab('sale')}
                      className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 ${
                        activeTab === 'sale'
                          ? 'bg-gradient-to-r from-primary-600 to-blue-600 text-white shadow-lg scale-105'
                          : 'text-gray-600 hover:text-primary-600 hover:bg-white/50'
                      }`}
                    >
                      🏡 Buy/Sell
                    </button>
                  </div>
                  
                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-8 slide-in-up" style={{animationDelay: '0.6s'}}>
                    <Link 
                      href={`/properties?type=${activeTab}`}
                      className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-primary-600 to-blue-600 text-white rounded-xl font-semibold text-lg hover:shadow-xl hover:scale-105 transition-all duration-200 hover-glow"
                    >
                      {activeTab === 'rent' ? '🔍 Find Rentals' : '🏠 Browse Properties'}
                      <ArrowRightIcon className="ml-2 h-5 w-5" />
                    </Link>
                    <button className="inline-flex items-center justify-center px-8 py-4 bg-white/80 backdrop-blur-sm border-2 border-gray-200 text-gray-700 rounded-xl font-semibold text-lg hover:border-primary-300 hover:shadow-lg transition-all duration-200 hover-lift">
                      <PlayIcon className="mr-2 h-5 w-5" />
                      Watch Demo
                    </button>
                  </div>
                  
                  {/* Trust Indicators */}
                  <div className="flex items-center space-x-6 text-sm text-gray-500 fade-in" style={{animationDelay: '0.8s'}}>
                    <div className="flex items-center">
                      <CheckIcon className="h-4 w-4 text-green-500 mr-1" />
                      No hidden fees
                    </div>
                    <div className="flex items-center">
                      <CheckIcon className="h-4 w-4 text-green-500 mr-1" />
                      Verified properties
                    </div>
                    <div className="flex items-center">
                      <CheckIcon className="h-4 w-4 text-green-500 mr-1" />
                      24/7 support
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Enhanced Property Card */}
              <div className="lg:col-span-6 mt-12 lg:mt-0">
                <div className="relative">
                  <div className="relative z-10 card-modern overflow-hidden transform rotate-3 hover:rotate-0 transition-transform duration-500 hover-lift float">
                    <div className="w-full h-80 bg-gradient-to-br from-primary-500 via-blue-600 to-purple-600 flex items-center justify-center hover-scale">
                      <div className="text-center text-white">
                        <HomeIcon className="h-16 w-16 mx-auto mb-4 opacity-80" />
                        <p className="text-lg font-medium">Beautiful Properties</p>
                        <p className="text-sm opacity-80">Find Your Dream Home</p>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Modern Apartment</h3>
                          <p className="text-gray-600 text-sm flex items-center">
                            <MapPinIcon className="h-4 w-4 mr-1" />
                            Bole, Addis Ababa
                          </p>
                        </div>
                        <div className="flex items-center">
                          <StarIconSolid className="h-4 w-4 text-yellow-400" />
                          <span className="text-sm text-gray-600 ml-1">4.9</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-bold text-primary-600">
                            {activeTab === 'rent' ? '15,000 ETB/month' : '2,500,000 ETB'}
                          </span>
                          <p className="text-xs text-gray-500">
                            {activeTab === 'rent' ? 'Monthly rent' : 'Sale price'}
                          </p>
                        </div>
                        <HeartIconSolid className="h-6 w-6 text-red-400 glow-pulse" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Floating Elements */}
                  <div className="absolute -top-4 -left-4 glass rounded-lg shadow-lg p-3 float">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-green-700">✅ Verified</span>
                    </div>
                  </div>
                  
                  <div className="absolute -bottom-4 -right-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl shadow-lg p-4 glow-pulse">
                    <div className="text-center">
                      <div className="text-2xl font-bold">98%</div>
                      <div className="text-xs">Satisfaction</div>
                    </div>
                  </div>

                  <div className="absolute top-1/2 -left-8 glass-dark rounded-lg p-3 text-white shimmer">
                    <CurrencyDollarIcon className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Property Types Grid */}
        <section className="py-16 bg-white" id="properties">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Explore Property Types
              </h2>
              <p className="text-gray-600">Find the perfect property for your needs</p>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {propertyTypes.map((type, index) => (
                <Link 
                  key={index}
                  href={`/properties?category=${type.name.toLowerCase()}&type=${type.type}`}
                  className="card-modern text-center hover-lift group"
                >
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${type.color} mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg text-2xl`}>
                    {type.emoji}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{type.name}</h3>
                  <p className="text-2xl font-bold text-primary-600 mb-1">{type.count}</p>
                  <p className="text-sm text-gray-500 capitalize">For {type.type}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced Stats */}
        <section className="py-16 bg-gradient-to-r from-primary-50 to-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center group">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-blue-600 rounded-2xl text-white mb-4 group-hover:scale-110 transition-transform duration-200 shadow-lg hover-glow text-2xl">
                    {stat.emoji}
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.number}</div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced Features */}
        <section id="features" className="py-24 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Why Choose Homie?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Experience the future of property transactions with our cutting-edge features 
                designed to make buying, selling, and renting properties effortless.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="card-modern hover-lift group relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} mb-6 group-hover:scale-110 transition-transform duration-200 shadow-lg text-2xl`}>
                    {feature.emoji}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.name}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section id="how-it-works" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
              <p className="text-xl text-gray-600">Get started in just three simple steps</p>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-12">
              {[
                {
                  step: '1',
                  title: 'Create Account',
                  description: 'Sign up and complete your profile with Fayda digital ID verification for instant trust and credibility.',
                  color: 'from-primary-500 to-blue-600',
                  emoji: '📝'
                },
                {
                  step: '2',
                  title: 'Browse & Connect',
                  description: 'Search thousands of verified properties for rent or sale. Connect directly with verified landlords, buyers, and sellers.',
                  color: 'from-green-500 to-emerald-600',
                  emoji: '🔍'
                },
                {
                  step: '3',
                  title: 'Complete Transaction',
                  description: 'Complete secure transactions, sign digital contracts, and enjoy automated payments and property management.',
                  color: 'from-purple-500 to-pink-600',
                  emoji: '✅'
                }
              ].map((item, index) => (
                <div key={index} className="text-center group">
                  <div className="relative mb-8">
                    <div className={`w-20 h-20 bg-gradient-to-br ${item.color} rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-200 shadow-lg hover-glow text-3xl`}>
                      {item.emoji}
                    </div>
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg border-2 border-gray-200">
                      <span className="text-sm font-bold text-gray-700">{item.step}</span>
                    </div>
                    {index < 2 && (
                      <div className="absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-primary-300 to-transparent hidden lg:block"></div>
                    )}
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-24 bg-gradient-to-b from-primary-50 to-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Users Say</h2>
              <p className="text-xl text-gray-600">Join thousands of satisfied users who found their perfect property</p>
            </div>
            
            <div className="relative">
              <div className="card-glass p-12 max-w-4xl mx-auto hover-lift">
                <div className="text-center">
                  <div className="flex justify-center mb-6">
                    {[...Array(5)].map((_, i) => (
                      <StarIconSolid key={i} className="h-6 w-6 text-yellow-400" />
                    ))}
                  </div>
                  
                  <blockquote className="text-2xl text-gray-900 font-medium mb-8 leading-relaxed">
                    "{testimonials[currentTestimonial].content}"
                  </blockquote>
                  
                  <div className="flex items-center justify-center space-x-4">
                    <img 
                      src={testimonials[currentTestimonial].image || '/default-avatar.png'} 
                      alt={testimonials[currentTestimonial].name}
                      className="w-16 h-16 rounded-full object-cover shadow-lg hover-scale"
                    />
                    <div className="text-left">
                      <div className="font-semibold text-gray-900 text-lg">
                        {testimonials[currentTestimonial].name}
                      </div>
                      <div className="text-gray-600">
                        {testimonials[currentTestimonial].role}
                        {testimonials[currentTestimonial].properties && (
                          <span> • {testimonials[currentTestimonial].properties} properties</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Testimonial indicators */}
              <div className="flex justify-center mt-8 space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentTestimonial 
                        ? 'bg-primary-600 scale-125' 
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Modern CTA */}
        <section className="py-24 bg-gradient-to-r from-primary-600 to-blue-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Find Your Perfect Property? 🏠
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of users who have already found their dream properties for rent or sale. 
              Start your journey today with Ethiopia's most trusted property platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/register"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 rounded-xl font-semibold text-lg hover:shadow-xl hover:scale-105 transition-all duration-200 hover-glow"
              >
                Get Started Free 🚀
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link 
                href="/properties"
                className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white rounded-xl font-semibold text-lg hover:bg-white hover:text-primary-600 transition-all duration-200"
              >
                Browse Properties 🔍
              </Link>
            </div>
          </div>
        </section>

        {/* Enhanced Footer */}
        <footer className="bg-gray-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8">
              <div className="lg:col-span-1">
                <div className="flex items-center space-x-2 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                    <HomeIcon className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold">Homie</span>
                </div>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  Ethiopia's most trusted property platform for buying, selling, and renting properties. 
                  Connecting verified users in a secure, transparent environment.
                </p>
                <div className="flex space-x-4">
                  <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary-600 transition-colors hover-lift">
                    <GlobeAltIcon className="h-5 w-5" />
                  </a>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-6">Platform</h3>
                <ul className="space-y-3 text-gray-400">
                  <li><Link href="/properties?type=rent" className="hover:text-white transition-colors">🏠 Find Rentals</Link></li>
                  <li><Link href="/properties?type=sale" className="hover:text-white transition-colors">🏡 Buy Properties</Link></li>
                  <li><Link href="/register" className="hover:text-white transition-colors">💼 Sell Properties</Link></li>
                  <li><Link href="/register" className="hover:text-white transition-colors">📋 List for Rent</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-6">Support</h3>
                <ul className="space-y-3 text-gray-400">
                  <li><Link href="#" className="hover:text-white transition-colors">❓ Help Center</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">📞 Contact Us</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">🛡️ Safety Guidelines</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">📋 Terms of Service</Link></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-6">Contact</h3>
                <div className="space-y-3 text-gray-400">
                  <div className="flex items-center space-x-3">
                    <EnvelopeIcon className="h-5 w-5" />
                    <span>support@homie.et</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <PhoneIcon className="h-5 w-5" />
                    <span>+251 911 123 456</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPinIcon className="h-5 w-5" />
                    <span>Addis Ababa, Ethiopia</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
              <p>&copy; 2024 Homie. All rights reserved. Made with ❤️ in Ethiopia.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default HomePage;