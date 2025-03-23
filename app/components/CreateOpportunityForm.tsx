'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useTransaction } from 'wagmi';
import { uploadFileToIPFS } from '../lib/ipfs';
import { isAddress } from 'viem';
import { useOpportunityFactory } from '../hooks/useOpportunityFactory';
import { sepolia } from 'wagmi/chains';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';

type VerificationDocument = {
  file: File;
  type: 'kyc' | 'proof';
};

// List of countries
const countries = [
  'Afghanistan',
  'Albania',
  'Algeria',
  'Andorra',
  'Angola',
  'Antigua and Barbuda',
  'Argentina',
  'Armenia',
  'Australia',
  'Austria',
  'Azerbaijan',
  'Bahamas',
  'Bahrain',
  'Bangladesh',
  'Barbados',
  'Belarus',
  'Belgium',
  'Belize',
  'Benin',
  'Bhutan',
  'Bolivia',
  'Bosnia and Herzegovina',
  'Botswana',
  'Brazil',
  'Brunei',
  'Bulgaria',
  'Burkina Faso',
  'Burundi',
  'Cabo Verde',
  'Cambodia',
  'Cameroon',
  'Canada',
  'Central African Republic',
  'Chad',
  'Chile',
  'China',
  'Colombia',
  'Comoros',
  'Congo',
  'Costa Rica',
  'Croatia',
  'Cuba',
  'Cyprus',
  'Czech Republic',
  'Denmark',
  'Djibouti',
  'Dominica',
  'Dominican Republic',
  'Ecuador',
  'Egypt',
  'El Salvador',
  'Equatorial Guinea',
  'Eritrea',
  'Estonia',
  'Eswatini',
  'Ethiopia',
  'Fiji',
  'Finland',
  'France',
  'Gabon',
  'Gambia',
  'Georgia',
  'Germany',
  'Ghana',
  'Greece',
  'Grenada',
  'Guatemala',
  'Guinea',
  'Guinea-Bissau',
  'Guyana',
  'Haiti',
  'Honduras',
  'Hungary',
  'Iceland',
  'India',
  'Indonesia',
  'Iran',
  'Iraq',
  'Ireland',
  'Israel',
  'Italy',
  'Jamaica',
  'Japan',
  'Jordan',
  'Kazakhstan',
  'Kenya',
  'Kiribati',
  'Korea, North',
  'Korea, South',
  'Kosovo',
  'Kuwait',
  'Kyrgyzstan',
  'Laos',
  'Latvia',
  'Lebanon',
  'Lesotho',
  'Liberia',
  'Libya',
  'Liechtenstein',
  'Lithuania',
  'Luxembourg',
  'Madagascar',
  'Malawi',
  'Malaysia',
  'Maldives',
  'Mali',
  'Malta',
  'Marshall Islands',
  'Mauritania',
  'Mauritius',
  'Mexico',
  'Micronesia',
  'Moldova',
  'Monaco',
  'Mongolia',
  'Montenegro',
  'Morocco',
  'Mozambique',
  'Myanmar',
  'Namibia',
  'Nauru',
  'Nepal',
  'Netherlands',
  'New Zealand',
  'Nicaragua',
  'Niger',
  'Nigeria',
  'North Macedonia',
  'Norway',
  'Oman',
  'Pakistan',
  'Palau',
  'Palestine',
  'Panama',
  'Papua New Guinea',
  'Paraguay',
  'Peru',
  'Philippines',
  'Poland',
  'Portugal',
  'Qatar',
  'Romania',
  'Russia',
  'Rwanda',
  'Saint Kitts and Nevis',
  'Saint Lucia',
  'Saint Vincent and the Grenadines',
  'Samoa',
  'San Marino',
  'Sao Tome and Principe',
  'Saudi Arabia',
  'Senegal',
  'Serbia',
  'Seychelles',
  'Sierra Leone',
  'Singapore',
  'Slovakia',
  'Slovenia',
  'Solomon Islands',
  'Somalia',
  'South Africa',
  'South Sudan',
  'Spain',
  'Sri Lanka',
  'Sudan',
  'Suriname',
  'Sweden',
  'Switzerland',
  'Syria',
  'Taiwan',
  'Tajikistan',
  'Tanzania',
  'Thailand',
  'Timor-Leste',
  'Togo',
  'Tonga',
  'Trinidad and Tobago',
  'Tunisia',
  'Turkey',
  'Turkmenistan',
  'Tuvalu',
  'Uganda',
  'Ukraine',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
  'Uruguay',
  'Uzbekistan',
  'Vanuatu',
  'Vatican City',
  'Venezuela',
  'Vietnam',
  'Yemen',
  'Zambia',
  'Zimbabwe',
] as const;

// List of causes
const causes = [
  'Education',
  'Healthcare',
  'Hunger',
  'Poverty',
  'Environment',
  'Disaster Relief',
  'Animal Welfare',
  'Human Rights',
  'Arts & Culture',
  'Community Development',
  'Children & Youth',
  'Elderly Care',
  'Disability Support',
  'Mental Health',
  'Refugee Support',
  'Women Empowerment',
  'Clean Water',
  'Renewable Energy',
  'Technology Access',
  'Sports & Recreation',
] as const;

type Country = (typeof countries)[number];
type Cause = (typeof causes)[number];

type ValidationErrors = {
  title?: string;
  summary?: string;
  description?: string;
  location?: string;
  cause?: string;
  fundingGoal?: string;
  recipientWallet?: string;
  kyc?: string;
  proof?: string;
};

// Helper function to get Sepolia explorer URLs
const getExplorerUrl = (type: 'tx' | 'address', hash: string) => {
  return `https://sepolia.etherscan.io/${type}/${hash}`;
};

export function CreateOpportunityForm() {
  const router = useRouter();
  const { address } = useAccount();
  const opportunityFactory = useOpportunityFactory();
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const { isSuccess } = useTransaction({ hash: txHash });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    description: '',
    location: '',
    cause: '',
    fundingGoal: '',
    recipientWallet: '',
  });
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [uploadProgress, setUploadProgress] = useState<{
    kyc: number;
    proof: number;
  }>({
    kyc: 0,
    proof: 0,
  });
  const [creationStage, setCreationStage] = useState<
    'idle' | 'uploading_docs' | 'uploading_metadata' | 'deploying'
  >('idle');

  const validateField = (
    name: keyof typeof formData,
    value: string
  ): string | undefined => {
    switch (name) {
      case 'title':
        return !value.trim()
          ? 'Title is required'
          : value.length < 5
          ? 'Title must be at least 5 characters'
          : undefined;
      case 'summary':
        return !value.trim()
          ? 'Summary is required'
          : value.length < 10
          ? 'Summary must be at least 10 characters'
          : undefined;
      case 'description': {
        if (!value.trim()) return 'Description is required';
        if (value.length < 50)
          return 'Description must be at least 50 characters';
        const wordCount = value.trim().split(/\s+/).length;
        if (wordCount > 1000) return 'Description must be less than 1000 words';
        return undefined;
      }
      case 'location':
        return !value ? 'Location is required' : undefined;
      case 'cause':
        return !value.trim() ? 'Cause is required' : undefined;
      case 'fundingGoal':
        return !value
          ? 'Funding goal is required'
          : parseFloat(value) <= 0
          ? 'Funding goal must be greater than 0'
          : undefined;
      case 'recipientWallet':
        return !value.trim()
          ? 'Recipient wallet address is required'
          : !isAddress(value as `0x${string}`)
          ? 'Invalid wallet address'
          : undefined;
      default:
        return undefined;
    }
  };

  const handleFieldChange = (name: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setValidationErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    // Validate all fields
    Object.entries(formData).forEach(([key, value]) => {
      const error = validateField(key as keyof typeof formData, value);
      if (error) {
        errors[key as keyof ValidationErrors] = error;
      }
    });

    // Validate KYC documents
    if (!documents.some((d) => d.type === 'kyc')) {
      errors.kyc = 'At least one verification document is required';
    }

    // Validate Proof documents
    if (!documents.some((d) => d.type === 'proof')) {
      errors.proof = 'At least one proof document is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDocumentUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'kyc' | 'proof'
  ) => {
    const files = e.target.files;
    if (!files?.length) return;

    const file = files[0];
    const maxSize = 1024 * 1024; // 1MB in bytes

    if (file.size > maxSize) {
      setValidationErrors((prev) => ({
        ...prev,
        [type]: `File size must not exceed 1MB. Current size: ${(
          file.size /
          (1024 * 1024)
        ).toFixed(2)}MB`,
      }));
      return;
    }

    const newDoc: VerificationDocument = {
      file: file,
      type,
    };

    setDocuments([...documents, newDoc]);
    // Clear the validation error if it exists
    setValidationErrors((prev) => ({
      ...prev,
      [type]: undefined,
    }));
  };

  const removeDocument = (index: number) => {
    const updatedDocs = documents.filter((_, i) => i !== index);
    setDocuments(updatedDocs);

    // Clear validation errors when all documents of a type are removed
    const kycDocs = updatedDocs.filter((d) => d.type === 'kyc');
    const proofDocs = updatedDocs.filter((d) => d.type === 'proof');

    setValidationErrors((prev) => ({
      ...prev,
      kyc:
        kycDocs.length === 0
          ? 'At least one verification document is required'
          : undefined,
      proof:
        proofDocs.length === 0
          ? 'At least one proof document is required'
          : undefined,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      setError('Please connect your account first');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    const toastId = toast.loading('Starting to create your opportunity...');

    try {
      // Upload documents to IPFS
      const kycDocs: { ipfsHash: string; fileType: string; type: string }[] =
        [];
      const proofDocs: { ipfsHash: string; fileType: string; type: string }[] =
        [];

      if (
        !formData.recipientWallet ||
        !documents.some((d) => d.type === 'kyc') ||
        !documents.some((d) => d.type === 'proof')
      ) {
        throw new Error(
          'Recipient wallet, verification document, and proof document are required'
        );
      }

      setCreationStage('uploading_docs');
      toast.loading('Uploading verification documents...', { id: toastId });

      // Upload KYC documents
      for (const doc of documents.filter((d) => d.type === 'kyc')) {
        const ipfsHash = await uploadFileToIPFS(doc.file);
        kycDocs.push({
          ipfsHash,
          fileType: doc.file.type,
          type: 'kyc',
        });
        setUploadProgress((prev) => ({
          ...prev,
          kyc:
            prev.kyc + 100 / documents.filter((d) => d.type === 'kyc').length,
        }));
      }

      toast.loading('Uploading proof documents...', { id: toastId });

      // Upload Proof documents
      for (const doc of documents.filter((d) => d.type === 'proof')) {
        const ipfsHash = await uploadFileToIPFS(doc.file);
        proofDocs.push({
          ipfsHash,
          fileType: doc.file.type,
          type: 'proof',
        });
        setUploadProgress((prev) => ({
          ...prev,
          proof:
            prev.proof +
            100 / documents.filter((d) => d.type === 'proof').length,
        }));
      }

      try {
        setCreationStage('uploading_metadata');
        toast.loading('Preparing your opportunity...', { id: toastId });

        // Create metadata
        const metadata = {
          title: formData.title,
          summary: formData.summary,
          description: formData.description,
          location: formData.location,
          cause: formData.cause,
          kyc: kycDocs,
          proofs: proofDocs,
        };

        // Upload metadata to IPFS
        const metadataBlob = new Blob([JSON.stringify(metadata)], {
          type: 'application/json',
        });
        const metadataFile = new File([metadataBlob], 'metadata.json', {
          type: 'application/json',
        });

        const metadataURI = await uploadFileToIPFS(metadataFile);

        setCreationStage('deploying');
        toast.loading('Creating your opportunity...', { id: toastId });

        // Deploy opportunity contract
        if (!opportunityFactory) {
          throw new Error('Opportunity factory contract is not initialized');
        }

        const tx = await opportunityFactory.createOpportunity(
          formData.title,
          formData.fundingGoal,
          formData.recipientWallet as `0x${string}`,
          metadataURI
        );

        setTxHash(tx as `0x${string}`);
        toast.success('Opportunity created successfully!', { id: toastId });
      } catch (metadataError) {
        toast.error('Failed to create opportunity. Please try again.', {
          id: toastId,
        });
        setError(`Error uploading metadata: ${metadataError}`);
        throw new Error(
          `Failed to upload metadata: ${
            metadataError instanceof Error
              ? metadataError.message
              : 'Unknown error'
          }`
        );
      }
    } catch (uploadError) {
      // Reset progress on error
      toast.error('Failed to upload documents. Please try again.', {
        id: toastId,
      });
      setUploadProgress({ kyc: 0, proof: 0 });
      setCreationStage('idle');
      setError(`Error during upload process: ${uploadError}`);
      throw new Error(
        `Upload failed: ${
          uploadError instanceof Error ? uploadError.message : 'Unknown error'
        }`
      );
    } finally {
      setIsSubmitting(false);
      setCreationStage('idle');
    }
  };

  const getButtonText = () => {
    if (!isSubmitting) return 'Create Opportunity';

    switch (creationStage) {
      case 'uploading_docs':
        return 'Uploading Documents...';
      case 'uploading_metadata':
        return 'Uploading Metadata...';
      case 'deploying':
        return 'Deploying Contract...';
      default:
        return 'Creating...';
    }
  };

  useEffect(() => {
    if (isSuccess && txHash) {
      // toast.success('Opportunity created successfully!');
      // Store success message in sessionStorage
      sessionStorage.setItem('opportunityCreated', formData.title);
      // Redirect to dashboard
      router.push('/dashboard');
    }
  }, [isSuccess, txHash, router, formData.title]);

  return (
    <>
      <Toaster position='top-right' />
      <form onSubmit={handleSubmit} className='space-y-6 max-w-2xl mx-auto'>
        {error && (
          <div className='bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md'>
            {error}
          </div>
        )}

        {txHash && (
          <div className='bg-blue-50 border border-blue-200 text-blue-600 px-4 py-3 rounded-md'>
            <p>
              Your opportunity is being created. You will be redirected to the
              dashboard shortly.
            </p>
            <p className='text-sm mt-1'>
              Note: It may take a few minutes for your opportunity to appear in
              the dashboard.
            </p>
          </div>
        )}

        <div>
          <label
            htmlFor='title'
            className='block text-sm font-medium text-gray-700'
          >
            Title<span className='text-xs text-gray-400'>*</span>
          </label>
          <input
            type='text'
            id='title'
            value={formData.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            className={`mt-1 block w-full rounded-md shadow-sm p-3 outline-none focus:ring-primary focus:border-primary ${
              validationErrors.title ? 'border-red-300' : 'border-gray-300'
            }`}
            required
          />
          {validationErrors.title && (
            <p className='mt-1 text-sm text-red-600'>
              {validationErrors.title}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor='summary'
            className='block text-sm font-medium text-gray-700'
          >
            Summary<span className='text-xs text-gray-400'>*</span>
          </label>
          <input
            type='text'
            id='summary'
            value={formData.summary}
            onChange={(e) => handleFieldChange('summary', e.target.value)}
            className={`mt-1 block w-full rounded-md shadow-sm p-3 outline-none focus:ring-primary focus:border-primary ${
              validationErrors.summary ? 'border-red-300' : 'border-gray-300'
            }`}
            required
          />
          {validationErrors.summary && (
            <p className='mt-1 text-sm text-red-600'>
              {validationErrors.summary}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor='description'
            className='block text-sm font-medium text-gray-700'
          >
            Description<span className='text-xs text-gray-400'>*</span>{' '}
            <span className='text-sm text-gray-500'>(max 1000 words)</span>
          </label>
          <textarea
            id='description'
            value={formData.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            placeholder="Explain the impact of your opportunity - describe the problem, your solution, beneficiaries, expected outcomes, timeline, and how you'll ensure transparency."
            rows={8}
            className={`mt-1 block w-full rounded-md shadow-sm p-3 outline-none focus:ring-primary focus:border-primary ${
              validationErrors.description
                ? 'border-red-300'
                : 'border-gray-300'
            }`}
            required
          />
          <div className='mt-1 flex justify-between'>
            <div>
              {validationErrors.description && (
                <p className='text-sm text-red-600'>
                  {validationErrors.description}
                </p>
              )}
            </div>
            <div className='text-sm text-gray-500'>
              {formData.description.trim().split(/\s+/).length} / 1000 words
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor='location'
            className='block text-sm font-medium text-gray-700'
          >
            Location<span className='text-xs text-gray-400'>*</span>
          </label>
          <select
            id='location'
            value={formData.location}
            onChange={(e) => handleFieldChange('location', e.target.value)}
            className={`mt-1 block w-full rounded-md shadow-sm p-3 outline-none focus:ring-primary focus:border-primary ${
              validationErrors.location ? 'border-red-300' : 'border-gray-300'
            }`}
            required
          >
            <option value=''>Select a country</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
          {validationErrors.location && (
            <p className='mt-1 text-sm text-red-600'>
              {validationErrors.location}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor='cause'
            className='block text-sm font-medium text-gray-700'
          >
            Cause<span className='text-xs text-gray-400'>*</span>
          </label>
          <select
            id='cause'
            value={formData.cause}
            onChange={(e) => handleFieldChange('cause', e.target.value)}
            className={`mt-1 block w-full rounded-md shadow-sm p-3 outline-none focus:ring-primary focus:border-primary ${
              validationErrors.cause ? 'border-red-300' : 'border-gray-300'
            }`}
            required
          >
            <option value=''>Select a cause</option>
            {causes.map((cause) => (
              <option key={cause} value={cause}>
                {cause}
              </option>
            ))}
          </select>
          {validationErrors.cause && (
            <p className='mt-1 text-sm text-red-600'>
              {validationErrors.cause}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor='fundingGoal'
            className='block text-sm font-medium text-gray-700'
          >
            Funding Goal<span className='text-xs text-gray-400'>*</span>
          </label>
          <input
            type='number'
            id='fundingGoal'
            value={formData.fundingGoal}
            onChange={(e) => handleFieldChange('fundingGoal', e.target.value)}
            step='0.01'
            min='0'
            className={`mt-1 block w-full rounded-md shadow-sm p-3 outline-none focus:ring-primary focus:border-primary ${
              validationErrors.fundingGoal
                ? 'border-red-300'
                : 'border-gray-300'
            }`}
            required
          />
          {validationErrors.fundingGoal && (
            <p className='mt-1 text-sm text-red-600'>
              {validationErrors.fundingGoal}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor='recipientWallet'
            className='block text-sm font-medium text-gray-700'
          >
            Recipient Wallet Address
            <span className='text-xs text-gray-400'>*</span>
          </label>
          <input
            type='text'
            id='recipientWallet'
            value={formData.recipientWallet}
            onChange={(e) =>
              handleFieldChange('recipientWallet', e.target.value)
            }
            placeholder='Wallet address'
            className={`mt-1 block w-full rounded-md shadow-sm p-3 outline-none focus:ring-primary focus:border-primary ${
              validationErrors.recipientWallet
                ? 'border-red-300'
                : 'border-gray-300'
            }`}
            required
          />
          {validationErrors.recipientWallet && (
            <p className='mt-1 text-sm text-red-600'>
              {validationErrors.recipientWallet}
            </p>
          )}
        </div>

        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Verification Documents
              <span className='text-xs text-gray-400'>*</span>
              <span className='text-xs text-gray-500 ml-2'>
                (Max size: 1MB)
              </span>
            </label>
            <div className='space-y-4'>
              <div className='relative'>
                <input
                  type='file'
                  onChange={(e) => handleDocumentUpload(e, 'kyc')}
                  accept='.pdf,.jpg,.jpeg,.png'
                  className={`block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 ${
                    validationErrors.kyc ? 'border-red-300' : ''
                  }`}
                  required={!documents.some((d) => d.type === 'kyc')}
                />
                {documents
                  .filter((d) => d.type === 'kyc')
                  .map((doc, index) => (
                    <div
                      key={index}
                      className='mt-2 flex items-center justify-between bg-gray-50 p-2 rounded-md'
                    >
                      <div className='flex-1 flex items-center space-x-2'>
                        <span className='text-sm text-gray-600'>
                          {doc.file.name}
                        </span>
                        <span className='text-xs text-gray-500'>
                          ({(doc.file.size / (1024 * 1024)).toFixed(2)}MB)
                        </span>
                        {isSubmitting && uploadProgress.kyc > 0 && (
                          <div className='flex-1 ml-4'>
                            <div className='w-full bg-gray-200 rounded-full h-1.5'>
                              <div
                                className='bg-primary h-1.5 rounded-full transition-all duration-300'
                                style={{ width: `${uploadProgress.kyc}%` }}
                              />
                            </div>
                            <span className='text-xs text-gray-500 mt-1'>
                              {uploadProgress.kyc}%
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        type='button'
                        onClick={() => removeDocument(index)}
                        disabled={isSubmitting}
                        className='text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded-md hover:bg-red-50 disabled:opacity-50'
                      >
                        Remove
                      </button>
                    </div>
                  ))}
              </div>
            </div>
            {validationErrors.kyc && (
              <p className='mt-1 text-sm text-red-600'>
                {validationErrors.kyc}
              </p>
            )}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Proof Documents
              <span className='text-xs text-gray-400'>*</span>
              <span className='text-xs text-gray-500 ml-2'>
                (Max size: 1MB)
              </span>
            </label>
            <div className='space-y-4'>
              <div className='relative'>
                <input
                  type='file'
                  onChange={(e) => handleDocumentUpload(e, 'proof')}
                  accept='.pdf,.jpg,.jpeg,.png'
                  className={`block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 ${
                    validationErrors.proof ? 'border-red-300' : ''
                  }`}
                  required={!documents.some((d) => d.type === 'proof')}
                />
                {documents
                  .filter((d) => d.type === 'proof')
                  .map((doc, index) => (
                    <div
                      key={index}
                      className='mt-2 flex items-center justify-between bg-gray-50 p-2 rounded-md'
                    >
                      <div className='flex-1 flex items-center space-x-2'>
                        <span className='text-sm text-gray-600'>
                          {doc.file.name}
                        </span>
                        <span className='text-xs text-gray-500'>
                          ({(doc.file.size / (1024 * 1024)).toFixed(2)}MB)
                        </span>
                        {isSubmitting && uploadProgress.proof > 0 && (
                          <div className='flex-1 ml-4'>
                            <div className='w-full bg-gray-200 rounded-full h-1.5'>
                              <div
                                className='bg-primary h-1.5 rounded-full transition-all duration-300'
                                style={{ width: `${uploadProgress.proof}%` }}
                              />
                            </div>
                            <span className='text-xs text-gray-500 mt-1'>
                              {uploadProgress.proof}%
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        type='button'
                        onClick={() => removeDocument(index)}
                        disabled={isSubmitting}
                        className='text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded-md hover:bg-red-50 disabled:opacity-50'
                      >
                        Remove
                      </button>
                    </div>
                  ))}
              </div>
            </div>
            {validationErrors.proof && (
              <p className='mt-1 text-sm text-red-600'>
                {validationErrors.proof}
              </p>
            )}
          </div>
          <div>
            <input
              type='checkbox'
              id='terms'
              name='terms'
              required
              onChange={(e) => {}}
            />
            <label htmlFor='terms' className='ml-2 text-sm text-gray-600'>
              I acknowledge that 5% is a platform fee, and I will receive 95% of
              the donation.
            </label>
          </div>
        </div>

        <button
          type='submit'
          disabled={isSubmitting || !address}
          className='w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 disabled:opacity-50'
        >
          {getButtonText()}
        </button>
      </form>
    </>
  );
}
