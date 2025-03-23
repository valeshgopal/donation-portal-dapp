'use client';

import { useState, useEffect } from 'react';
import { countries, Country } from '../lib/countries';

interface FilterProps {
  onFilterChange: (filters: {
    cause: string;
    location: Country | '';
    status: 'active' | 'inactive' | 'all';
    search: string;
  }) => void;
  causes: string[];
}

export default function OpportunityFilters({
  onFilterChange,
  causes,
}: FilterProps) {
  const [selectedCause, setSelectedCause] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<Country | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<
    'active' | 'inactive' | 'all'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    onFilterChange({
      cause: selectedCause,
      location: selectedLocation,
      status: selectedStatus,
      search: searchQuery,
    });
  }, [
    selectedCause,
    selectedLocation,
    selectedStatus,
    searchQuery,
    onFilterChange,
  ]);

  return (
    <div className='bg-white rounded-lg shadow-sm p-4'>
      <div className='flex flex-col md:flex-row gap-4'>
        {/* Search Bar */}
        <div className='w-full'>
          <input
            type='text'
            id='search'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Search by title...'
            className='w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-0 focus:border-primary focus:outline-none'
          />
        </div>

        <div className='flex flex-col sm:flex-row gap-4 w-full md:w-auto'>
          {/* Cause Filter */}
          <div className='w-full sm:w-48'>
            <select
              value={selectedCause}
              onChange={(e) => setSelectedCause(e.target.value)}
              className='w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-0 focus:border-primary focus:outline-none'
            >
              <option value=''>All Causes</option>
              {causes.map((cause) => (
                <option key={cause} value={cause}>
                  {cause}
                </option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div className='w-full sm:w-48'>
            <select
              value={selectedLocation}
              onChange={(e) =>
                setSelectedLocation(e.target.value as Country | '')
              }
              className='w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-0 focus:border-primary focus:outline-none'
            >
              <option value=''>All Locations</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className='w-full sm:w-40'>
            <select
              value={selectedStatus}
              onChange={(e) =>
                setSelectedStatus(
                  e.target.value as 'active' | 'inactive' | 'all'
                )
              }
              className='w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-0 focus:border-primary focus:outline-none'
            >
              <option value='all'>All Status</option>
              <option value='active'>Active</option>
              <option value='inactive'>Inactive</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
