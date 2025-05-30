/* eslint-disable no-undef */
/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import styled from "styled-components";

const DashboardContainer = styled.div`
  width: 100%;
  background-color: white;
`;

const TabButton = styled.button`
  padding: 0.5rem;
  font-size: 0.875rem;
  border: none;
  background: none;
  color: ${(props) => (props.active ? "#3b82f6" : "#6b7280")};
  border-bottom: 2px solid
    ${(props) => (props.active ? "#3b82f6" : "transparent")};
  transition: all 0.2s;

  &:hover {
    color: ${(props) => (props.active ? "#3b82f6" : "#374151")};
  }
`;

const PaginationButton = styled.button`
  padding: 0.5rem 1rem;
  margin: 0 0.25rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  background-color: white;
  color: #374151;
  font-size: 0.875rem;
  cursor: pointer;

  &:disabled {
    background-color: #f3f4f6;
    color: #9ca3af;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background-color: #f3f4f6;
  }
`;

const Dashboard = () => {
  const [websiteData, setWebsiteData] = useState(null);
  const [timeRange, setTimeRange] = useState("daily");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Define items per page for each time range
  const ITEMS_PER_PAGE = {
    daily: 7, // 7 days per page
    weekly: 4, // 4 weeks per page
    monthly: 6, // 6 months per page
  };

  // Maximum number of items to show for each time range
  const MAX_ITEMS = {
    daily: 30, // Last 30 days
    weekly: 12, // Last 12 weeks
    monthly: 12, // Last 12 months
  };

  // Helper function to get the date of a specific week
  const getDateOfWeek = (weekStr) => {
    const [year, week] = weekStr.split("-W");
    const startOfYear = new Date(parseInt(year), 0, 1);
    const weekNumber = parseInt(week);

    // Get to the first Thursday of the year
    startOfYear.setDate(startOfYear.getDate() + (4 - startOfYear.getDay()));

    // Get to the Monday of the desired week
    const targetDate = new Date(startOfYear);
    targetDate.setDate(startOfYear.getDate() + (weekNumber - 1) * 7);

    return targetDate;
  };
  // Helper function to format week label
  const formatWeekLabel = (weekStr) => {
    const date = getDateOfWeek(weekStr);
    const endDate = new Date(date);
    endDate.setDate(date.getDate() + 6);

    return `${date.getDate()}/${date.getMonth() + 1} - ${endDate.getDate()}/${
      endDate.getMonth() + 1
    }`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await chrome.storage.local.get(["websiteData"]);
        const processed = processData(data.websiteData || {}, timeRange);

        // Limit the data based on MAX_ITEMS
        processed.chartData = processed.chartData.slice(-MAX_ITEMS[timeRange]);

        setWebsiteData(processed);
        setTotalPages(
          Math.ceil(processed.chartData.length / ITEMS_PER_PAGE[timeRange])
        );
        setCurrentPage(0); // Reset to first page when data changes
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();

    chrome.storage.onChanged.addListener((changes) => {
      if (changes.websiteData) {
        const processed = processData(
          changes.websiteData.newValue || {},
          timeRange
        );
        processed.chartData = processed.chartData.slice(-MAX_ITEMS[timeRange]);
        setWebsiteData(processed);
        setTotalPages(
          Math.ceil(processed.chartData.length / ITEMS_PER_PAGE[timeRange])
        );
      }
    });
  }, [timeRange]);

  const getDomainName = (url) => {
    return url.replace(/^www\./, "");
  };

  const processData = (data, range) => {
    const timeData = {};
    const domains = new Set();

    Object.entries(data).forEach(([domain, stats]) => {
      const cleanDomain = getDomainName(domain);
      domains.add(cleanDomain);

      const periodData = stats.totalTime[range];

      Object.entries(periodData || {}).forEach(([timeKey, duration]) => {
        let label = timeKey;

        if (range === "daily") {
          const date = new Date(timeKey);
          label = `${date.getDate()}/${date.getMonth() + 1}`;
        } else if (range === "weekly") {
          label = formatWeekLabel(timeKey);
        } else if (range === "monthly") {
          const [year, month] = timeKey.split("-");
          const date = new Date(year, parseInt(month) - 1);
          label = date.toLocaleString("default", { month: "short" });
        }

        if (!timeData[label]) {
          timeData[label] = {
            fullDate: timeKey,
            originalLabel: timeKey, // Store original date string for sorting
            ...Object.fromEntries(Array.from(domains).map((d) => [d, 0])),
          };
        }
        timeData[label][cleanDomain] = Math.round(duration / 60000);
      });
    });
    const chartData = Object.entries(timeData)
      .map(([label, data]) => ({
        name: label,
        fullDate: data.fullDate,
        originalLabel: data.originalLabel,
        ...data,
      }))
      .sort((a, b) => {
        if (range === "daily") {
          return new Date(a.fullDate) - new Date(b.fullDate);
        } else if (range === "weekly") {
          return a.originalLabel.localeCompare(b.originalLabel);
        } else {
          const [yearA, monthA] = a.fullDate.split("-");
          const [yearB, monthB] = b.fullDate.split("-");
          return new Date(yearA, monthA - 1) - new Date(yearB, monthB - 1);
        }
      });

    return { chartData, domains: Array.from(domains) };
  };

  const formatMinutes = (minutes) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    }
    return `${minutes}m`;
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 rounded-md shadow-md border border-gray-200 text-xs">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatMinutes(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getDisplayData = () => {
    if (!websiteData?.chartData) return [];

    const start = currentPage * ITEMS_PER_PAGE[timeRange];
    return websiteData.chartData.slice(
      start,
      start + ITEMS_PER_PAGE[timeRange]
    );
  };

  const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#6366f1"];

  // Get date range text for current page
  const getDateRangeText = () => {
    const data = getDisplayData();
    if (data.length === 0) return "";

    if (timeRange === "weekly") {
      const firstWeek = getDateOfWeek(data[0].originalLabel);
      const lastWeek = getDateOfWeek(data[data.length - 1].originalLabel);
      lastWeek.setDate(lastWeek.getDate() + 6); // End of last week
      return `${firstWeek.toLocaleDateString()} - ${lastWeek.toLocaleDateString()}`;
    }

    const firstDate = new Date(data[0].fullDate);
    const lastDate = new Date(data[data.length - 1].fullDate);
    return `${firstDate.toLocaleDateString()} - ${lastDate.toLocaleDateString()}`;
  };

  return (
    <DashboardContainer>
      <h1 className="text-xl font-bold mb-4">Website Usage</h1>

      <div className="flex space-x-2 mb-4 border-b">
        {["daily", "weekly", "monthly"].map((range) => (
          <TabButton
            key={range}
            active={timeRange === range}
            onClick={() => {
              setTimeRange(range);
              setCurrentPage(0);
            }}
          >
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </TabButton>
        ))}
      </div>

      {websiteData?.chartData?.length ? (
        <>
          <div className="text-sm text-gray-600 mb-2 text-center">
            {getDateRangeText()}
          </div>

          <div style={{ height: "400px", width: "100%" }}>
            <ResponsiveContainer>
              <BarChart
                data={getDisplayData()}
                margin={{ top: 10, right: 30, left: 20, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={50}
                  tick={{ fontSize: 10, fill: "#4b5563" }}
                />
                <YAxis
                  tickFormatter={formatMinutes}
                  tick={{ fontSize: 10, fill: "#4b5563" }}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {websiteData.domains.map((domain, index) => (
                  <Bar
                    key={domain}
                    dataKey={domain}
                    name={domain}
                    stackId="a"
                    fill={COLORS[index % COLORS.length]}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-4 space-x-2">
              <PaginationButton
                onClick={() => setCurrentPage((curr) => Math.max(0, curr - 1))}
                disabled={currentPage === 0}
              >
                Previous
              </PaginationButton>
              <span className="text-sm text-gray-600">
                Page {currentPage + 1} of {totalPages}
              </span>
              <PaginationButton
                onClick={() =>
                  setCurrentPage((curr) => Math.min(totalPages - 1, curr + 1))
                }
                disabled={currentPage === totalPages - 1}
              >
                Next
              </PaginationButton>
            </div>
          )}
        </>
      ) : (
        <div className="h-40 flex items-center justify-center">
          <p className="text-gray-500 text-sm">Start adding sites 📊📊.</p>
        </div>
      )}
    </DashboardContainer>
  );
};

export default Dashboard;
