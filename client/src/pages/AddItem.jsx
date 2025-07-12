import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Plus, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import axios from 'axios';

const AddItem = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    type: '',
    size: '',
    condition: '',
    tags: '',
    points: ''
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationResults, setVerificationResults] = useState({});
  const [verifying, setVerifying] = useState(false);

  const categories = ['tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories'];
  const types = ['men', 'women', 'unisex'];
  const conditions = ['new', 'like-new', 'good', 'fair', 'poor'];
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }
    setImages([...images, ...files]);
    setError('');
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    // Remove verification result for this image
    const newVerificationResults = { ...verificationResults };
    delete newVerificationResults[index];
    setVerificationResults(newVerificationResults);
  };

  const verifyImage = async (image, index) => {
    if (!formData.description || !formData.category) {
      setError('Please fill in description and category before verifying images');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('image', image);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);

      console.log('Sending verification request for image:', index);
      console.log('Description:', formData.description);
      console.log('Category:', formData.category);

      const response = await axios.post('/api/verification/verify-image', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Verification response:', response.data);

      setVerificationResults(prev => ({
        ...prev,
        [index]: response.data.verification
      }));

    } catch (error) {
      console.error('Verification error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Error verifying image. Please try again.';
      setError(`Verification failed: ${errorMessage}`);
    } finally {
      setVerifying(false);
    }
  };

  const verifyAllImages = async () => {
    if (!formData.description || !formData.category) {
      setError('Please fill in description and category before verifying images');
      return;
    }

    if (images.length === 0) {
      setError('Please upload at least one image to verify');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      images.forEach(image => {
        formDataToSend.append('images', image);
      });
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);

      const response = await axios.post('/api/verification/verify-item', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Update verification results for each image
      const newVerificationResults = {};
      response.data.verificationResults.forEach((result, index) => {
        newVerificationResults[index] = result;
      });
      setVerificationResults(newVerificationResults);

      // Show overall result
      if (!response.data.allImagesMatch) {
        setError(`Verification complete: ${response.data.recommendation}`);
      }

    } catch (error) {
      console.error('Verification error:', error);
      setError('Error verifying images. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Basic validation
    if (!formData.title || !formData.description || !formData.category || !formData.type || !formData.condition) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    // Check verification results and confidence scores
    const verificationEntries = Object.entries(verificationResults);
    
    if (verificationEntries.length > 0) {
      // Check for low confidence scores (less than 50%)
      const lowConfidenceImages = verificationEntries.filter(([index, result]) => result.confidence < 50);
      
      if (lowConfidenceImages.length > 0) {
        setError(`Cannot list item: ${lowConfidenceImages.length} image(s) have confidence scores below 50%. Please improve your image descriptions or upload better images.`);
        setLoading(false);
        return;
      }

      // Check for failed verifications
      const failedVerifications = verificationEntries.filter(([index, result]) => !result.matches);
      if (failedVerifications.length > 0) {
        const shouldContinue = window.confirm(
          `${failedVerifications.length} image(s) failed verification. The AI detected that the images may not match your description. Do you want to continue anyway?`
        );
        if (!shouldContinue) {
          setLoading(false);
          return;
        }
      }
    }

    try {
      const formDataToSend = new FormData();
      
      // Add form fields
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Add images
      images.forEach(image => {
        formDataToSend.append('images', image);
      });

      console.log('Sending form data:', {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        type: formData.type,
        condition: formData.condition,
        imagesCount: images.length
      });

      const response = await axios.post('/api/items', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Item created successfully:', response.data);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating item:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      setError(error.response?.data?.message || 'Error creating item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">List an Item</h1>
        <p className="text-gray-600 dark:text-gray-400">Share your clothing with the community</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Verification Status */}
        {Object.keys(verificationResults).length > 0 && (
          <div className={`px-4 py-3 rounded-lg border ${
            Object.values(verificationResults).some(r => r.confidence < 50) 
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
              : Object.values(verificationResults).filter(r => r.matches).length === Object.keys(verificationResults).length
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Image Verification Status</h3>
                <p className="text-sm opacity-90">
                  {Object.values(verificationResults).filter(r => r.matches).length} of {Object.keys(verificationResults).length} images verified successfully
                  {Object.values(verificationResults).some(r => r.confidence < 50) && (
                    <span className="block text-red-600 dark:text-red-400 font-medium">
                      ⚠️ Some images have low confidence scores (&lt;50%). Cannot list item.
                    </span>
                  )}
                </p>
              </div>
              <div className="flex space-x-2">
                {Object.values(verificationResults).some(r => r.confidence < 50) ? (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                ) : Object.values(verificationResults).filter(r => r.matches).length === Object.keys(verificationResults).length ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Image Upload */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Images</h2>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <div className="mt-4">
                <label htmlFor="images" className="inline-flex items-center bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 cursor-pointer">
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Images
                </label>
                <input
                  id="images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Upload up to 5 images (JPG, PNG, GIF)
              </p>
            </div>

            {images.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {images.length} image(s) uploaded
                  </span>
                  <button
                    type="button"
                    onClick={verifyAllImages}
                    disabled={verifying || !formData.description || !formData.category}
                    className="inline-flex items-center bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {verifying ? 'Verifying...' : 'Verify All Images'}
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative border rounded-lg overflow-hidden">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                      
                      {/* Verification Button */}
                      <div className="p-2 bg-gray-50 dark:bg-gray-800">
                        <button
                          type="button"
                          onClick={() => verifyImage(image, index)}
                          disabled={verifying || !formData.description || !formData.category}
                          className="w-full inline-flex items-center justify-center bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium py-1 px-2 rounded transition-colors duration-200 disabled:cursor-not-allowed"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          {verifying ? 'Verifying...' : 'Verify'}
                        </button>
                      </div>
                      
                      {/* Verification Result */}
                      {verificationResults[index] && (
                        <div className={`p-2 text-xs ${
                          verificationResults[index].confidence < 50
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                            : verificationResults[index].matches 
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                            : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                        }`}>
                          <div className="flex items-center space-x-1 mb-1">
                            {verificationResults[index].confidence < 50 ? (
                              <AlertCircle className="w-3 h-3" />
                            ) : verificationResults[index].matches ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <AlertCircle className="w-3 h-3" />
                            )}
                            <span className="font-medium">
                              {verificationResults[index].confidence < 50 
                                ? 'Low confidence' 
                                : verificationResults[index].matches 
                                ? 'Matches' 
                                : 'Does not match'
                              }
                            </span>
                            <span className={`text-xs ${
                              verificationResults[index].confidence < 50 
                                ? 'text-red-600 dark:text-red-400 font-bold' 
                                : 'text-gray-500'
                            }`}>
                              ({verificationResults[index].confidence}% confidence)
                            </span>
                          </div>
                          <p className="text-xs opacity-90">
                            {verificationResults[index].detectedItem}
                          </p>
                          {verificationResults[index].confidence < 50 && (
                            <p className="text-xs font-medium text-red-600 dark:text-red-400 mt-1">
                              ⚠️ Cannot list with this confidence score
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Basic Information */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., Vintage Denim Jacket"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category *
              </label>
              <select
                id="category"
                name="category"
                required
                value={formData.category}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type *
              </label>
              <select
                id="type"
                name="type"
                required
                value={formData.type}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">Select Type</option>
                {types.map((type) => (
                  <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="size" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Size
              </label>
              <select
                id="size"
                name="size"
                value={formData.size}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">Select Size</option>
                {sizes.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="condition" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Condition *
              </label>
              <select
                id="condition"
                name="condition"
                required
                value={formData.condition}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">Select Condition</option>
                {conditions.map((cond) => (
                  <option key={cond} value={cond}>{cond.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="points" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Points Value
              </label>
              <input
                type="number"
                id="points"
                name="points"
                min="0"
                value={formData.points}
                onChange={handleChange}
                className="input-field"
                placeholder="0"
              />
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="input-field"
              placeholder="Describe your item in detail..."
            />
          </div>

          <div className="mt-6">
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="input-field"
              placeholder="e.g., vintage, denim, casual (separate with commas)"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="btn-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Creating...</span>
              </div>
            ) : (
              'List Item'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddItem; 