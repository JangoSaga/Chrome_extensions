/* eslint-disable react/prop-types */
import {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
} from "react";
import { StorageUtils } from "../utils/storageUtils";

const GoalsContext = createContext({
  goals: [],
  updateGoalTarget: () => {},
});

function GoalProgress({ children }) {
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const savedGoals = await StorageUtils.getGoals();
        setGoals(savedGoals || []);
      } catch (error) {
        console.error("Error fetching goals:", error);
      }
    };
    fetchGoals();
  }, []);

  const calculateProgress = useCallback(async (goal) => {
    const { totalFocusTime, totalDistractedTime } =
      await StorageUtils.getCategoryTime();
    const totalTime = await StorageUtils.getTotalTimeSpentOverall();

    let currentValue = 0;

    switch (goal.type) {
      case "FOCUS_INC":
        currentValue = totalFocusTime;
        break;
      case "DISTRACTION_LIMIT":
        currentValue = totalDistractedTime;
        break;
      case "TOTAL_PRODUCTIVITY":
        currentValue = totalTime - totalDistractedTime;
        break;
      default:
        break;
    }

    return Math.min((currentValue / goal.target) * 100, 100).toFixed(2);
  }, []);

  useEffect(() => {
    const updateGoalProgress = async () => {
      try {
        const updatedGoals = await Promise.all(
          goals.map(async (goal) => {
            const progress = await calculateProgress(goal);
            return { ...goal, progress: Number(progress) };
          })
        );
        setGoals(updatedGoals);
      } catch (error) {
        console.error("Error updating goal progress:", error);
      }
    };

    if (goals.length) {
      updateGoalProgress();
    }
  }, [goals, calculateProgress]);

  const updateGoalTarget = async (goalType, newTarget) => {
    const updatedGoals = goals.map((goal) =>
      goal.type === goalType ? { ...goal, target: newTarget } : goal
    );
    setGoals(updatedGoals);

    try {
      await StorageUtils.updateGoals(updatedGoals);
    } catch (error) {
      console.error("Error updating goals:", error);
    }
  };

  return (
    <GoalsContext.Provider value={{ goals, updateGoalTarget }}>
      {children}
    </GoalsContext.Provider>
  );
}

function useGoals() {
  const context = useContext(GoalsContext);
  if (!context) {
    throw new Error("useGoals must be used within a GoalProgress provider");
  }
  return context;
}

export { GoalProgress, useGoals };
