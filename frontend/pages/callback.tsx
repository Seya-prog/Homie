import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../src/store';
import { completeKYCVerification } from '../src/store/slices/userSlice';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const CallbackPage: NextPage = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const { code, state, error } = router.query;

      if (error) {
        setStatus('error');
        setMessage(`KYC verification failed: ${error}`);
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
        return;
      }

      if (code && state && typeof code === 'string' && typeof state === 'string') {
        try {
          // Call the backend callback endpoint directly with code and state
          const response = await fetch('/api/auth/fayda/callback', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // Include cookies for authentication
            body: JSON.stringify({ code, state }),
          });

          if (response.ok) {
            const data = await response.json();
            setStatus('success');
            setMessage('KYC verification completed successfully!');
            
            // Update the user's authentication state
            if (data.token) {
              // Store the new token if provided
              document.cookie = `token=${data.token}; path=/; secure; samesite=strict`;
              dispatch(completeKYCVerification(data.token));
            }
            
            setTimeout(() => {
              router.push('/dashboard');
            }, 2000);
          } else {
            const errorData = await response.json();
            setStatus('error');
            setMessage(errorData.message || 'KYC verification failed');
            setTimeout(() => {
              router.push('/dashboard');
            }, 3000);
          }
        } catch (error: any) {
          setStatus('error');
          setMessage('Network error during KYC verification');
          setTimeout(() => {
            router.push('/dashboard');
          }, 3000);
        }
      } else if (router.isReady) {
        setStatus('error');
        setMessage('Invalid callback parameters');
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      }
    };

    if (router.isReady) {
      handleCallback();
    }
  }, [router, dispatch]);

  return (
    <>
      <Head>
        <title>KYC Verification - Homie</title>
        <meta name="description" content="Completing KYC verification" />
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            {status === 'loading' && (
              <>
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary-100">
                  <svg className="animate-spin h-8 w-8 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                  Processing KYC Verification
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                  Please wait while we complete your identity verification...
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                  <CheckCircleIcon className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                  Verification Successful!
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                  {message}
                </p>
                <p className="mt-2 text-center text-sm text-gray-500">
                  Redirecting you to dashboard...
                </p>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
                  <XCircleIcon className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                  Verification Failed
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                  {message}
                </p>
                <p className="mt-2 text-center text-sm text-gray-500">
                  Redirecting you back to dashboard...
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CallbackPage;