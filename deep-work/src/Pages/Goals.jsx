import { useState } from "react";
import { useGoals } from "../hooks/useGoals";

const Goals = () => {
  const { goals, updateGoalTarget } = useGoals();
  const [newTarget, setNewTarget] = useState("");

  const handleUpdateTarget = (goalType) => {
    if (newTarget > 0) {
      updateGoalTarget(goalType, Number(newTarget));
      setNewTarget("");
    } else {
      alert("Please enter a valid target.");
    }
  };

  return (
    <div className="goals-page">
      <h2>Goals</h2>
      {goals.length > 0 ? (
        goals.map((goal) => (
          <div key={goal.type} className="goal">
            <p>{goal.description}</p>
            <p>Target: {goal.target}</p>
            <p>Progress: {goal.progress}%</p>
            <input
              type="number"
              placeholder="New target"
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
            />
            <button onClick={() => handleUpdateTarget(goal.type)}>
              Update Target
            </button>
          </div>
        ))
      ) : (
        <p>No goals set yet.</p>
      )}
    </div>
  );
};

export default Goals;
