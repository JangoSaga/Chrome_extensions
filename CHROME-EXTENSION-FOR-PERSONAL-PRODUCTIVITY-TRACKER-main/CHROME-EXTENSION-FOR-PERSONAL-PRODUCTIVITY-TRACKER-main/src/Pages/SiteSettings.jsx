/* eslint-disable no-undef */
import { useState, useEffect } from "react";
import styled from "styled-components";

const SettingsContainer = styled.div`
  width: 100%;
  background-color: white;
`;

const Title = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
`;

const InputGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const Input = styled.input`
  flex: 1;
  padding: 0.375rem 0.5rem;
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

const AddButton = styled.button`
  background-color: #3b82f6;
  color: white;
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;

  &:hover {
    background-color: #2563eb;
  }
`;

const DeleteButton = styled.button`
  color: #dc2626;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;

  &:hover {
    background-color: #fee2e2;
  }
`;

const SiteList = styled.ul`
  max-height: 300px;
  overflow-y: auto;
`;

const SiteItem = styled.li`
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

const EmptyState = styled.li`
  color: #6b7280;
  text-align: center;
  padding: 1rem 0;
  font-size: 0.875rem;
`;

// ... rest of the SiteSettings component logic remains the same ...
const SiteSettings = () => {
  const [distractedSites, setDistractedSites] = useState([]);
  const [newSite, setNewSite] = useState("");

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

  const handleAddSite = async () => {
    if (newSite.trim()) {
      try {
        await chrome.runtime.sendMessage({
          type: "ADD_DISTRACTED_SITE",
          site: newSite,
        });
        setDistractedSites((prevSites) => [...prevSites, newSite]);
        setNewSite("");
      } catch (error) {
        console.error("Error adding distracted site:", error);
        alert("Failed to add site. Please try again.");
      }
    }
  };

  const handleDeleteSite = async (site) => {
    try {
      await chrome.runtime.sendMessage({
        type: "DELETE_DISTRACTED_SITE",
        site,
      });
      setDistractedSites((prevSites) => prevSites.filter((s) => s !== site));
    } catch (error) {
      console.error("Error deleting distracted site:", error);
      alert("Failed to delete site. Please try again.");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleAddSite();
    }
  };

  return (
    <SettingsContainer>
      <div className="p-6">
        <Title>Manage Distracting Sites</Title>

        <InputGroup>
          <Input
            type="text"
            placeholder="Enter site (e.g., youtube.com)"
            value={newSite}
            onChange={(e) => setNewSite(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <AddButton onClick={handleAddSite}>Add Site</AddButton>
        </InputGroup>

        <div>
          <h2>Current Distracting Sites</h2>

          <SiteList>
            {distractedSites.length > 0 ? (
              distractedSites.map((site, index) => (
                <SiteItem key={index}>
                  <span>{site}</span>
                  <DeleteButton onClick={() => handleDeleteSite(site)}>
                    Delete
                  </DeleteButton>
                </SiteItem>
              ))
            ) : (
              <EmptyState>No distracting sites added yet.</EmptyState>
            )}
          </SiteList>
        </div>
      </div>
    </SettingsContainer>
  );
};

export default SiteSettings;
