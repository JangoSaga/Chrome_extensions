/* eslint-disable no-undef */
import { useState, useEffect } from "react";
import styled from "styled-components";

const GoalsContainer = styled.div`
  width: 100%;
  background-color: white;
`;

const Title = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
`;

const SiteRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.875rem;

  &:last-child {
    border-bottom: none;
  }
`;

const SiteName = styled.span`
  color: #374151;
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TimeInput = styled.input`
  min-width: 4.5rem;
  padding: 0.25rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: #374151;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
`;

const SaveButton = styled.button`
  background-color: #3b82f6;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background-color 0.2s;
  margin-top: 1rem;

  &:hover {
    background-color: #2563eb;
  }
`;

const EmptyState = styled.p`
  color: #6b7280;
  text-align: center;
  padding: 1rem 0;
  font-size: 0.875rem;
`;


const Goals = () => {
  const [distractedSites, setDistractedSites] = useState([]);
  const [siteLimits, setSiteLimits] = useState({});

  useEffect(() => {
    const fetchDistractedSites = async () => {
      try {
        const data = await chrome.storage.local.get(["distracted_domains"]);
        setDistractedSites(data.distracted_domains || []);
      } catch (error) {
        console.error("Error fetching distracted sites:", error);
      }
    };

    fetchDistractedSites();
  }, []);

  const handleLimitChange = (site, value) => {
    setSiteLimits((prevState) => ({
      ...prevState,
      [site]: value,
    }));
  };

  const handleSaveGoals = async () => {
    try {
      await chrome.storage.local.set({ siteLimits });
      // Show success message
      alert("Time limits saved successfully!");
    } catch (error) {
      console.error("Error saving goals:", error);
      alert("Failed to save time limits. Please try again.");
    }
  };

  return (
    <GoalsContainer>
      <div className="p-6">
        <Title>Set Time Limits for Distracting Sites</Title>
        <i> 💫 You will be redirected to www.google.com after limit exceeds</i>
        {distractedSites.length > 0 ? (
          <>
            <div>
              {distractedSites.map((site, index) => (
                <SiteRow key={index}>
                  <SiteName>{site}</SiteName>
                  <TimeInput
                    type="number"
                    min="0"
                    placeholder="Minutes"
                    value={siteLimits[site] || ""}
                    onChange={(e) => handleLimitChange(site, e.target.value)}
                  />
                </SiteRow>
              ))}
            </div>
            <SaveButton onClick={handleSaveGoals}>Save Time Limits</SaveButton>
          </>
        ) : (
          <EmptyState>
            No distracting sites added yet. Add sites in the Site Settings page.
          </EmptyState>
        )}
      </div>
    </GoalsContainer>
  );
};

export default Goals;
