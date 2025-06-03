import { useState, useEffect } from "react";
import { StorageUtils } from "../utils/storageUtils";

const SiteSettings = () => {
  const [categories, setCategories] = useState({
    focusSites: [],
    distractedSites: [],
  });
  const [newSite, setNewSite] = useState("");
  const [category, setCategory] = useState("focusSites");

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const {
          focusSites: focusList = [],
          distractedSites: distractedList = [],
        } = await StorageUtils.getCategories();
        setCategories({
          focusSites: focusList,
          distractedSites: distractedList,
        });
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Add site to a category
  const addSite = async (e) => {
    e.preventDefault(); // Prevent form refresh
    if (newSite.trim() && category) {
      const updatedCategories = { ...categories };
      if (updatedCategories[category].includes(newSite.trim())) {
        alert("Site already exists in this category.");
        return;
      }
      updatedCategories[category] = [
        ...(categories[category] || []),
        newSite.trim(),
      ];
      try {
        await StorageUtils.updateCategories(updatedCategories);
        setCategories(updatedCategories);
        setNewSite(""); // Clear input field
      } catch (error) {
        console.error("Error updating categories:", error);
      }
    }
  };

  return (
    <div className="site-settings">
      <h2>Site Settings</h2>

      {/* Form to Add Site */}
      <form onSubmit={addSite}>
        <input
          type="text"
          placeholder="Add site"
          value={newSite}
          onChange={(e) => setNewSite(e.target.value)}
          required
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="focusSites">Focus Sites</option>
          <option value="distractedSites">Distracted Sites</option>
        </select>
        <button type="submit">Add Site</button>
      </form>

      {/* Display Categories */}
      <div>
        <h3>Focus Sites</h3>
        <ul>
          {categories.focusSites?.map((site, index) => (
            <li key={index}>{site}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3>Distracted Sites</h3>
        <ul>
          {categories.distractedSites?.map((site, index) => (
            <li key={index}>{site}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SiteSettings;
