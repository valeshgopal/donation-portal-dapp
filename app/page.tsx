'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useDonationOpportunities } from './hooks/useDonationOpportunities';
import { Opportunity } from './lib/contracts/types';
import { formatEther } from 'viem';
import Image from 'next/image';

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Regular Donor',
    image:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
    text: 'The transparency of blockchain technology gives me confidence that my donations are making a real impact.',
  },
  {
    name: 'Michael Chen',
    role: 'NGO Director',
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    text: 'This platform has revolutionized how we receive and track donations. The verification process ensures trust.',
  },
  {
    name: 'Emma Davis',
    role: 'Community Leader',
    image:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
    text: 'Being able to see the impact of donations in real-time has helped us build stronger connections with donors.',
  },
  {
    name: 'David Wilson',
    role: 'Tech Enthusiast',
    image:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
    text: 'The combination of blockchain and charitable giving is brilliant. The platform is easy to use and secure.',
  },
  {
    name: 'Maria Garcia',
    role: 'Foundation Manager',
    image:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
    text: 'The minimal fees and direct transfer of funds make this platform stand out from traditional donation methods.',
  },
];

export default function Home() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const { getFeaturedOpportunities } = useDonationOpportunities();

  useEffect(() => {
    async function fetchOpportunities() {
      try {
        setLoading(true);
        const featured = await getFeaturedOpportunities();
        console.log('Fetched featured opportunities:', featured);
        setOpportunities(featured);
      } catch (error) {
        console.error('Error fetching opportunities:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchOpportunities();
  }, [getFeaturedOpportunities]);

  return (
    <div className='relative'>
      {/* Hero Section */}
      <div className='relative h-[500px] mt-0 mb-12'>
        <div className='absolute inset-0'>
          <Image
            src='https://images.unsplash.com/photo-1639815188546-c43c240ff4df?auto=format&fit=crop&w=2000'
            alt='Decentralized finance and charity concept'
            fill
            className='object-cover brightness-45 bg-blend-overlay'
            priority
          />
          <div className='absolute inset-0 bg-gradient-to-r from-blue-900/80 to-primary/50' />
        </div>
        <div className='relative container mx-auto px-4 h-full flex flex-col justify-center items-center'>
          <h1 className='text-5xl font-bold text-center mb-6 text-white max-w-3xl'>
            Decentralized Donation Platform
          </h1>
          <p className='text-2xl text-center text-gray-200 max-w-2xl'>
            Connect with verified recipients and make secure cryptocurrency
            donations
          </p>
          <Link
            href='/opportunities'
            className='mt-8 px-8 py-3 bg-white text-primary rounded-full text-lg font-semibold hover:bg-gray-100 transition-colors'
          >
            Start Donating
          </Link>
        </div>
      </div>

      {/* Rest of the content */}
      <div className='container mx-auto px-4'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12'>
          <div className='bg-white p-6 rounded-lg shadow-md'>
            <div className='relative h-56 -mx-6 -mt-6 mb-6 overflow-hidden'>
              <Image
                src='https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800'
                alt='Blockchain transparency'
                fill
                className='object-cover hover:scale-105 transition-transform duration-300 rounded-t-lg'
              />
            </div>
            <h3 className='text-xl font-semibold mb-4'>
              Transparent Donations
            </h3>
            <p className='text-gray-600'>
              Track your donations on the blockchain with complete transparency
            </p>
          </div>

          <div className='bg-white p-6 rounded-lg shadow-md'>
            <div className='relative h-56 -mx-6 -mt-6 mb-6 overflow-hidden'>
              <Image
                src='https://images.unsplash.com/photo-1631260281790-c9147ea95724?auto=format&fit=crop&w=800'
                alt='Verified identity'
                fill
                className='object-cover hover:scale-105 transition-transform duration-300 rounded-t-lg'
              />
            </div>
            <h3 className='text-xl font-semibold mb-4'>Verified Recipients</h3>
            <p className='text-gray-600'>
              All recipients undergo thorough KYC verification
            </p>
          </div>

          <div className='bg-white p-6 rounded-lg shadow-md'>
            <div className='relative h-56 -mx-6 -mt-6 mb-6 overflow-hidden'>
              <Image
                src='https://images.unsplash.com/photo-1571771709966-cc773c80a9fe?auto=format&fit=crop&w=800'
                alt='Minimal fees'
                fill
                className='object-cover hover:scale-105 transition-transform duration-300 rounded-t-lg'
              />
            </div>
            <h3 className='text-xl font-semibold mb-4'>Minimal Fees</h3>
            <p className='text-gray-600'>
              Only 5% platform fee, rest goes directly to recipients
            </p>
          </div>
        </div>

        <div className='mb-8'>
          <div className='flex justify-between items-center mb-6'>
            <h2 className='text-2xl font-bold'>Featured Opportunities</h2>
            <Link
              href='/opportunities'
              className='text-primary hover:text-primary/80 font-medium'
            >
              View All
            </Link>
          </div>

          {loading ? (
            <div className='animate-pulse grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className='h-96 w-356 bg-gray-200 rounded-lg'
                ></div>
              ))}
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {opportunities.map((opportunity) => (
                <Link
                  key={opportunity.id.toString()}
                  href={`/opportunities/${opportunity.address}`}
                  className='bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow'
                >
                  <h3 className='text-xl font-semibold mb-2'>
                    {opportunity.title}
                  </h3>
                  <p className='text-gray-600 mb-4'>{opportunity.summary}</p>
                  <div className='space-y-2'>
                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-500'>Goal</span>
                      <span className='font-medium'>
                        {formatEther(opportunity.fundingGoal)} ETH
                      </span>
                    </div>
                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-500'>Raised</span>
                      <span className='font-medium'>
                        {formatEther(opportunity.currentRaised)} ETH
                      </span>
                    </div>
                    <div className='w-full bg-gray-200 rounded-full h-2'>
                      <div
                        className='bg-gradient-to-r from-green-400 to-green-600 transition-all duration-300 ease-in-out h-2 rounded-full'
                        style={{
                          width: `${Math.min(
                            (Number(opportunity.currentRaised) /
                              Number(opportunity.fundingGoal)) *
                              100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <div className='client-only'>
                      <Link
                        href={`/opportunities/${opportunity.address}`}
                        className='block text-center bg-primary text-white py-2 px-4 rounded-md mt-4 hover:bg-primary/90'
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Testimonials Section */}
        <div className='mb-16'>
          <h2 className='text-2xl font-bold text-center mb-8'>
            What Our Users Say
          </h2>
          <div className='relative overflow-hidden'>
            <div className='flex animate-scroll space-x-8 whitespace-nowrap'>
              {[...Array(2)].map((_, dupIndex) => (
                <div key={dupIndex} className='flex space-x-8'>
                  {testimonials.map((testimonial, index) => (
                    <div
                      key={`${dupIndex}-${index}`}
                      className='inline-block w-[320px] bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow'
                    >
                      <div className='relative w-16 h-16 mx-auto mb-4 rounded-full overflow-hidden'>
                        <Image
                          src={testimonial.image}
                          alt={testimonial.name}
                          fill
                          className='object-cover'
                          sizes='(max-width: 64px) 100vw'
                        />
                      </div>
                      <p className='text-gray-600 italic mb-4 normal-case break-words whitespace-normal min-h-[80px] text-center'>
                        "{testimonial.text}"
                      </p>
                      <div className='font-semibold text-center'>
                        {testimonial.name}
                      </div>
                      <div className='text-sm text-gray-500 text-center'>
                        {testimonial.role}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <footer className='bg-gray-800 text-white py-12 -mx-4 mt-auto'>
          <div className='container mx-auto px-4'>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
              <div>
                <h3 className='text-lg font-semibold mb-4'>About Us</h3>
                <p className='text-gray-400'>
                  A decentralized platform connecting donors with verified
                  recipients, leveraging blockchain technology for transparent
                  and secure donations.
                </p>
              </div>
              <div>
                <h3 className='text-lg font-semibold mb-4'>Quick Links</h3>
                <ul className='space-y-2'>
                  <li>
                    <Link
                      href='/opportunities'
                      className='text-gray-400 hover:text-white'
                    >
                      Browse Opportunities
                    </Link>
                  </li>
                  <li>
                    <Link
                      href='/dashboard'
                      className='text-gray-400 hover:text-white'
                    >
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link
                      href='/about'
                      className='text-gray-400 hover:text-white'
                    >
                      About
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className='text-lg font-semibold mb-4'>Resources</h3>
                <ul className='space-y-2'>
                  <li>
                    <Link
                      href='/faq'
                      className='text-gray-400 hover:text-white'
                    >
                      FAQ
                    </Link>
                  </li>
                  <li>
                    <Link
                      href='/terms'
                      className='text-gray-400 hover:text-white'
                    >
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link
                      href='/privacy'
                      className='text-gray-400 hover:text-white'
                    >
                      Privacy Policy
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className='text-lg font-semibold mb-4'>Connect With Us</h3>
                <div className='flex space-x-4'>
                  <a
                    href='#'
                    className='text-gray-400 hover:text-white text-2xl'
                  >
                    𝕏
                  </a>
                  <a
                    href='#'
                    className='text-gray-400 hover:text-white text-2xl'
                  >
                    📘
                  </a>
                  <a
                    href='#'
                    className='text-gray-400 hover:text-white text-2xl'
                  >
                    📸
                  </a>
                  <a
                    href='#'
                    className='text-gray-400 hover:text-white text-2xl'
                  >
                    💼
                  </a>
                </div>
              </div>
            </div>
            <div className='border-t border-gray-700 mt-8 pt-8 text-center text-gray-400'>
              <p>
                &copy; {new Date().getFullYear()} Donation Platform. All rights
                reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
