/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';

import {
  Plus,
  Edit2,
  Trash2,
  Globe,
  Tag,
  Download,
  Filter,
  Upload,
  AlertCircle,
} from 'lucide-react';

const Home = () => {
  const [websites, setWebsites] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredWebsites, setFilteredWebsites] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDomain, setCurrentDomain] = useState('');

  const [formData, setFormData] = useState({
    domain: '',
    category: 'Entertainment',
    description: '',
  });

  // Check if running in Chrome extension context
  const isExtensionContext =
    typeof chrome !== 'undefined' &&
    chrome.runtime &&
    chrome.runtime.sendMessage;

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedCategory === 'All') {
      setFilteredWebsites(websites);
    } else {
      setFilteredWebsites(
        websites.filter((site) => site.category === selectedCategory)
      );
    }
  }, [websites, selectedCategory]);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (isExtensionContext) {
        // Load data from Chrome extension
        await Promise.all([
          loadWebsites(),
          loadCategories(),
          getCurrentDomain(),
        ]);
      } else {
        // Load mock data for demo
        loadMockData();
      }
    } catch (err) {
      setError('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadWebsites = () => {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action: 'getWebsiteData' }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (response && response.success) {
          setWebsites(response.websites || []);
          resolve(response.websites);
        } else {
          reject(new Error(response?.error || 'Failed to load websites'));
        }
      });
    });
  };

  const loadCategories = () => {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action: 'getCategories' }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (response && response.success) {
          setCategories(response.categories || []);
          resolve(response.categories);
        } else {
          reject(new Error(response?.error || 'Failed to load categories'));
        }
      });
    });
  };

  const getCurrentDomain = () => {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'getCurrentDomain' }, (response) => {
        if (response && response.success && response.domain) {
          setCurrentDomain(response.domain);
          // Auto-fill form with current domain if not already categorized
          if (!response.website) {
            setFormData((prev) => ({ ...prev, domain: response.domain }));
          }
        }
        resolve();
      });
    });
  };

  const loadMockData = () => {
    const mockWebsites = [
      {
        id: 1,
        domain: 'youtube.com',
        category: 'Entertainment',
        description: 'Video streaming platform',
        visits: 45,
        lastVisit: new Date().toISOString(),
        dateAdded: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 2,
        domain: 'github.com',
        category: 'Technology',
        description: 'Code repository and collaboration',
        visits: 23,
        lastVisit: new Date().toISOString(),
        dateAdded: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 3,
        domain: 'coursera.org',
        category: 'Education',
        description: 'Online learning platform',
        visits: 12,
        lastVisit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        dateAdded: new Date(
          Date.now() - 10 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
    ];

    const mockCategories = [
      'Entertainment',
      'Education',
      'Work',
      'Social Media',
      'News',
      'Shopping',
      'Technology',
      'Health',
      'Finance',
      'Travel',
    ];

    setWebsites(mockWebsites);
    setCategories(mockCategories);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.domain.trim()) return;

    setError(null);

    try {
      const websiteData = {
        ...formData,
        domain: formData.domain
          .replace(/^https?:\/\//, '')
          .replace(/^www\./, ''),
      };

      if (isEditing) {
        websiteData.id = editingId;
      }

      if (isExtensionContext) {
        // Save via Chrome extension
        await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(
            { action: 'saveWebsiteData', data: websiteData },
            (response) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
              }

              if (response && response.success) {
                setWebsites(response.websites || []);
                resolve();
              } else {
                reject(new Error(response?.error || 'Failed to save website'));
              }
            }
          );
        });
      } else {
        // Mock save for demo
        if (isEditing) {
          setWebsites((prev) =>
            prev.map((site) =>
              site.id === editingId ? { ...site, ...websiteData } : site
            )
          );
        } else {
          const newWebsite = {
            ...websiteData,
            id: Date.now(),
            visits: 0,
            lastVisit: null,
            dateAdded: new Date().toISOString(),
          };
          setWebsites((prev) => [...prev, newWebsite]);
        }
      }

      // Reset form
      setFormData({
        domain: '',
        category: categories[0] || 'Entertainment',
        description: '',
      });
      setIsEditing(false);
      setEditingId(null);
    } catch (err) {
      setError('Failed to save website: ' + err.message);
    }
  };

  const handleEdit = (website) => {
    setFormData({
      domain: website.domain,
      category: website.category,
      description: website.description,
    });
    setIsEditing(true);
    setEditingId(website.id);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this website?')) return;

    setError(null);

    try {
      if (isExtensionContext) {
        // Delete via Chrome extension
        await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(
            { action: 'deleteWebsite', id },
            (response) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
              }

              if (response && response.success) {
                setWebsites(response.websites || []);
                resolve();
              } else {
                reject(
                  new Error(response?.error || 'Failed to delete website')
                );
              }
            }
          );
        });
      } else {
        // Mock delete for demo
        setWebsites((prev) => prev.filter((site) => site.id !== id));
      }
    } catch (err) {
      setError('Failed to delete website: ' + err.message);
    }
  };

  const handleExport = async () => {
    try {
      if (isExtensionContext) {
        chrome.runtime.sendMessage({ action: 'exportData' }, (response) => {
          if (response && response.success) {
            const dataStr = JSON.stringify(response.data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `sitesort-backup-${
              new Date().toISOString().split('T')[0]
            }.json`;
            link.click();
            URL.revokeObjectURL(url);
          }
        });
      } else {
        // Mock export for demo
        const exportData = {
          websites,
          categories,
          exportDate: new Date().toISOString(),
          version: '1.0.0',
        };
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sitesort-backup-${
          new Date().toISOString().split('T')[0]
        }.json`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      setError('Failed to export data: ' + err.message);
    }
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importData = JSON.parse(e.target.result);

        if (isExtensionContext) {
          chrome.runtime.sendMessage(
            { action: 'importData', data: importData },
            (response) => {
              if (response && response.success) {
                loadInitialData(); // Reload data
                alert('Data imported successfully!');
              } else {
                setError(
                  'Failed to import data: ' +
                    (response?.error || 'Unknown error')
                );
              }
            }
          );
        } else {
          // Mock import for demo
          if (importData.websites) setWebsites(importData.websites);
          if (importData.categories) setCategories(importData.categories);
          alert('Data imported successfully!');
        }
      } catch (err) {
        setError('Failed to parse import file: ' + err.message);
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      domain: '',
      category: categories[0] || 'Entertainment',
      description: '',
    });
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading SiteSort Pro...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  SiteSort Pro
                </h1>
                {currentDomain && (
                  <p className="text-sm text-gray-500">
                    Current: {currentDomain}
                  </p>
                )}
                {!isExtensionContext && (
                  <p className="text-xs text-orange-500">
                    Demo Mode - Extension not detected
                  </p>
                )}
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleExport}
                className="flex items-center space-x-1 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
              <label className="flex items-center space-x-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors cursor-pointer">
                <Upload className="h-4 w-4" />
                <span>Import</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </header>
      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center space-x-2 mb-6">
                <Plus className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-800">
                  {isEditing ? 'Edit Website' : 'Add Website'}
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Domain
                  </label>
                  <input
                    type="text"
                    value={formData.domain}
                    onChange={(e) =>
                      setFormData({ ...formData, domain: e.target.value })
                    }
                    placeholder="e.g., youtube.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Brief description of the website"
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!formData.domain.trim()}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isEditing ? 'Update' : 'Add Website'}
                  </button>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Table and Filter Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filter Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center space-x-2 mb-4">
                <Filter className="h-5 w-5 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-800">
                  Filter by Category
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedCategory === 'All'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All ({websites.length})
                </button>
                {categories.map((category) => {
                  const count = websites.filter(
                    (site) => site.category === category
                  ).length;
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        selectedCategory === category
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Table Section */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <Tag className="h-5 w-5 text-green-600" />
                  <h2 className="text-xl font-semibold text-gray-800">
                    Website Categories ({filteredWebsites.length})
                  </h2>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Domain
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stats
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredWebsites.length === 0 ? (
                      <tr>
                        <td
                          colSpan="5"
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          {websites.length === 0
                            ? 'No websites added yet. Add your first website above!'
                            : 'No websites found for the selected category'}
                        </td>
                      </tr>
                    ) : (
                      filteredWebsites.map((website) => (
                        <tr
                          key={website.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <div className="bg-blue-100 p-2 rounded-lg">
                                <Globe className="h-4 w-4 text-blue-600" />
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {website.domain}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {website.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 max-w-xs truncate">
                            <span className="text-sm text-gray-600">
                              {website.description || 'No description'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {website.visits > 0 && (
                              <div>
                                <div>{website.visits} visits</div>
                                {website.lastVisit && (
                                  <div className="text-xs">
                                    Last:{' '}
                                    {new Date(
                                      website.lastVisit
                                    ).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleEdit(website)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(website.id)}
                                className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <p className="text-gray-300">
              SiteSort Pro - Organize your web browsing experience
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Intelligent website categorization with Chrome extension
              integration
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
