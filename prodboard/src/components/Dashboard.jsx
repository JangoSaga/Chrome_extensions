import React, { useState, useEffect } from 'react';
import {
  Clock,
  Plus,
  Trash2,
  Settings,
  BarChart3,
  Shield,
  Bell,
  Timer,
} from 'lucide-react';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [siteData, setSiteData] = useState({
    websiteData: {},
    distracted_domains: [],
    siteLimit: {},
  });
  const [newSite, setNewSite] = useState('');
  const [newLimit, setNewLimit] = useState('');
  const [selectedSite, setSelectedSite] = useState('');
  const [notificationSettings, setNotificationSettings] = useState({
    enabled: true,
    warningTime: 30,
    showRemaining: true,
  });
  const [loading, setLoading] = useState(true);

  // Load data on component mount
  useEffect(() => {
    loadData();
    loadNotificationSettings();
  }, []);

  const loadData = async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({ type: 'GET_SITE_DATA' }, (response) => {
          if (response && response.status === 'success') {
            setSiteData(response.data);
          }
          setLoading(false);
        });
      } else {
        // Mock data for development
        setSiteData({
          websiteData: {
            'www.youtube.com': {
              visits: 45,
              totalTime: {
                daily: { '2025-06-04': 1800000 }, // 30 minutes
                weekly: { '2025-W23': 7200000 }, // 2 hours
                monthly: { '2025-6': 21600000 }, // 6 hours
              },
              firstVisit: Date.now() - 7 * 24 * 60 * 60 * 1000,
              lastVisit: Date.now(),
              title: 'YouTube',
            },
            'www.yahoo.com': {
              visits: 23,
              totalTime: {
                daily: { '2025-06-04': 900000 }, // 15 minutes
                weekly: { '2025-W23': 3600000 }, // 1 hour
                monthly: { '2025-6': 10800000 }, // 3 hours
              },
              firstVisit: Date.now() - 5 * 24 * 60 * 60 * 1000,
              lastVisit: Date.now() - 60000,
              title: 'Yahoo',
            },
          },
          distracted_domains: ['www.youtube.com', 'www.yahoo.com'],
          siteLimit: {
            'www.youtube.com': 30,
            'www.example.com': 1,
          },
        });
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const loadNotificationSettings = async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['notificationSettings'], (result) => {
          if (result.notificationSettings) {
            setNotificationSettings(result.notificationSettings);
          }
        });
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const addDistractedSite = () => {
    if (!newSite.trim()) return;

    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage(
        {
          type: 'ADD_DISTRACTED_SITE',
          site: newSite.trim(),
        },
        (response) => {
          if (response && response.status === 'success') {
            loadData();
            setNewSite('');
          }
        }
      );
    } else {
      // Mock for development
      setSiteData((prev) => ({
        ...prev,
        distracted_domains: [...prev.distracted_domains, newSite.trim()],
      }));
      setNewSite('');
    }
  };

  const deleteDistractedSite = (site) => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage(
        {
          type: 'DELETE_DISTRACTED_SITE',
          site: site,
        },
        (response) => {
          if (response && response.status === 'success') {
            loadData();
          }
        }
      );
    } else {
      // Mock for development
      setSiteData((prev) => ({
        ...prev,
        distracted_domains: prev.distracted_domains.filter(
          (domain) => domain !== site
        ),
      }));
    }
  };

  const updateSiteLimit = () => {
    if (!selectedSite || !newLimit) return;

    const limit = parseInt(newLimit);
    if (isNaN(limit) || limit < 1) return;

    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage(
        {
          type: 'UPDATE_SITE_LIMIT',
          site: selectedSite,
          limit: limit,
        },
        (response) => {
          if (response && response.status === 'success') {
            loadData();
            setNewLimit('');
            setSelectedSite('');
          }
        }
      );
    } else {
      // Mock for development
      setSiteData((prev) => ({
        ...prev,
        siteLimit: { ...prev.siteLimit, [selectedSite]: limit },
      }));
      setNewLimit('');
      setSelectedSite('');
    }
  };

  const saveNotificationSettings = () => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ notificationSettings }, () => {
        console.log('Notification settings saved');
      });
    }
  };

  const formatTime = (milliseconds) => {
    const minutes = Math.floor(milliseconds / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const getTodayTime = (siteData) => {
    const today = new Date().toISOString().split('T')[0];
    return siteData.totalTime?.daily?.[today] || 0;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'sites', label: 'Manage Sites', icon: Shield },
    { id: 'limits', label: 'Time Limits', icon: Timer },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ProdBoard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            ProdBoard Dashboard
          </h1>
          <p className="text-gray-600">Track and manage your website usage</p>
        </div>

        {/* Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-lg">
            <div className="flex space-x-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-4 py-2 rounded-md font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(siteData.websiteData).map(([domain, data]) => (
                <div
                  key={domain}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800 truncate">
                      {data.title || domain}
                    </h3>
                    <div className="text-2xl">🌐</div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Today
                      </span>
                      <span className="font-semibold text-indigo-600">
                        {formatTime(getTodayTime(data))}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Visits</span>
                      <span className="font-semibold">{data.visits}</span>
                    </div>

                    {siteData.siteLimit[domain] && (
                      <div className="mt-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Daily Limit</span>
                          <span>{siteData.siteLimit[domain]} min</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`rounded-full h-2 ${
                              getTodayTime(data) / 60000 >
                              siteData.siteLimit[domain]
                                ? 'bg-red-500'
                                : 'bg-green-500'
                            }`}
                            style={{
                              width: `${Math.min(
                                (getTodayTime(data) /
                                  60000 /
                                  siteData.siteLimit[domain]) *
                                  100,
                                100
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {Object.keys(siteData.websiteData).length === 0 && (
                <div className="col-span-full text-center py-12">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No Data Yet
                  </h3>
                  <p className="text-gray-500">
                    Visit some websites to see your usage statistics here!
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'sites' && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Manage Distracting Sites
              </h2>

              {/* Add New Site */}
              <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">
                  Add New Site
                </h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newSite}
                    onChange={(e) => setNewSite(e.target.value)}
                    placeholder="e.g., www.facebook.com"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && addDistractedSite()}
                  />
                  <button
                    onClick={addDistractedSite}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Site
                  </button>
                </div>
              </div>

              {/* Sites List */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-700 mb-3">
                  Tracked Sites
                </h3>
                {siteData.distracted_domains.length > 0 ? (
                  siteData.distracted_domains.map((domain) => (
                    <div
                      key={domain}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <span className="font-medium text-gray-800">
                        {domain}
                      </span>
                      <button
                        onClick={() => deleteDistractedSite(domain)}
                        className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No sites added yet. Add some sites to start tracking!
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'limits' && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Time Limits
              </h2>

              {/* Set New Limit */}
              <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">
                  Set Time Limit
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <select
                    value={selectedSite}
                    onChange={(e) => setSelectedSite(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select a site</option>
                    {siteData.distracted_domains.map((domain) => (
                      <option key={domain} value={domain}>
                        {domain}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={newLimit}
                    onChange={(e) => setNewLimit(e.target.value)}
                    placeholder="Minutes per day"
                    min="1"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <button
                    onClick={updateSiteLimit}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
                  >
                    <Timer className="w-4 h-4 mr-2" />
                    Set Limit
                  </button>
                </div>
              </div>

              {/* Current Limits */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-700 mb-3">
                  Current Limits
                </h3>
                {Object.keys(siteData.siteLimit).length > 0 ? (
                  Object.entries(siteData.siteLimit).map(([domain, limit]) => (
                    <div
                      key={domain}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <span className="font-medium text-gray-800">
                        {domain}
                      </span>
                      <span className="text-indigo-600 font-semibold">
                        {limit} minutes/day
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No time limits set. Set limits to control your usage!
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Notification Settings
              </h2>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-700">
                      Enable Notifications
                    </h3>
                    <p className="text-gray-500">
                      Get notified when approaching time limits
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.enabled}
                      onChange={(e) =>
                        setNotificationSettings((prev) => ({
                          ...prev,
                          enabled: e.target.checked,
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-2">
                    Warning Time (seconds before limit)
                  </label>
                  <input
                    type="number"
                    value={notificationSettings.warningTime}
                    onChange={(e) =>
                      setNotificationSettings((prev) => ({
                        ...prev,
                        warningTime: parseInt(e.target.value) || 30,
                      }))
                    }
                    min="5"
                    max="300"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-700">
                      Show Remaining Time
                    </h3>
                    <p className="text-gray-500">
                      Display remaining time in notifications
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationSettings.showRemaining}
                      onChange={(e) =>
                        setNotificationSettings((prev) => ({
                          ...prev,
                          showRemaining: e.target.checked,
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <button
                  onClick={saveNotificationSettings}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Save Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
