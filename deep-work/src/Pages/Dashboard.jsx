import { useEffect, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";
import { StorageUtils } from "../utils/storageUtils";

ChartJS.register(ArcElement, Tooltip, Legend);

const Dashboard = () => {
  const [focusPercentage, setFocusPercentage] = useState(0);
  const [distractedPercentage, setDistractedPercentage] = useState(0);
  const [idleTimePercentage, setIdleTimePercentage] = useState(0);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);

  const fetchDashboardData = async () => {
    const { totalFocusTime, totalDistractedTime } =
      await StorageUtils.getCategoryTime();
    const totalTime = await StorageUtils.getTotalTimeSpentOverall();
    setTotalTimeSpent(totalTime);

    if (totalTime > 0) {
      setFocusPercentage((totalFocusTime / totalTime) * 100);
      setDistractedPercentage((totalDistractedTime / totalTime) * 100);
      setIdleTimePercentage(
        ((totalTime - (totalFocusTime + totalDistractedTime)) / totalTime) * 100
      );
    } else {
      setFocusPercentage(0);
      setDistractedPercentage(0);
      setIdleTimePercentage(100);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchDashboardData();

    // Set up storage change listener
    const handleStorageChange = (changes) => {
      if (changes.websiteData) {
        fetchDashboardData();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    // Cleanup listener
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const pieData = {
    labels: ["Focus", "Distracted", "Idle"],
    datasets: [
      {
        data: [focusPercentage, distractedPercentage, idleTimePercentage],
        backgroundColor: ["#36A2EB", "#FF6384", "yellow"],
      },
    ],
  };

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      <Pie data={pieData} />
      <p>Focus Percentage: {focusPercentage.toFixed(2)}%</p>
      <p>Distracted Percentage: {distractedPercentage.toFixed(2)}%</p>
      <p>Idle Percentage: {idleTimePercentage.toFixed(2)}%</p>
      <p>Total Time Spent: {StorageUtils.formatTime(totalTimeSpent)}</p>
    </div>
  );
};

export default Dashboard;
