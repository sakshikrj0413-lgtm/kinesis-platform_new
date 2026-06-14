import { useState } from "react";

const FILTERS = [
  { key: "ALL", label: "All" },
  { key: "OPEN", label: "Open" },
  { key: "CLOSED", label: "Closed" },
  { key: "BINARY", label: "Binary" },
  { key: "MULTI_OUTCOME", label: "Multi" },
];

export default function MarketFilters({ onFilterChange }) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [searchFocused, setSearchFocused] = useState(false);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    onFilterChange?.({ search: e.target.value, status: activeFilter });
  };

  const handleFilterClick = (key) => {
    setActiveFilter(key);
    onFilterChange?.({ search, status: key });
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
      <style>{`.kinesis-placeholder::placeholder { color: #6b8a6b; }`}</style>
      <div style={{ position: "relative", flex: 1, minWidth: 240 }}>
        <svg
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            width: 20,
            height: 20,
            color: "#6b8a6b",
          }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          placeholder="Search markets..."
          className="kinesis-placeholder"
          style={{
            width: "100%",
            backgroundColor: "rgba(11,15,11,0.5)",
            border: `1px solid ${
              searchFocused
                ? "rgba(0,255,136,0.5)"
                : "rgba(22,30,22,0.5)"
            }`,
            borderRadius: 12,
            paddingLeft: 40,
            paddingRight: 16,
            paddingTop: 10,
            paddingBottom: 10,
            color: "#e8f5e8",
            outline: "none",
            boxShadow: searchFocused
              ? "0 0 0 1px rgba(0,255,136,0.2)"
              : "none",
            transition: "all 0.2s",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          backgroundColor: "rgba(11,15,11,0.5)",
          border: "1px solid rgba(22,30,22,0.5)",
          borderRadius: 12,
          padding: 6,
        }}
      >
        {FILTERS.map((f) => {
          const isActive = activeFilter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => handleFilterClick(f.key)}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "#e8f5e8";
                  e.currentTarget.style.backgroundColor =
                    "rgba(22,30,22,0.5)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "#6b8a6b";
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
              style={{
                paddingLeft: 16,
                paddingRight: 16,
                paddingTop: 8,
                paddingBottom: 8,
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                transition: "all 0.2s",
                backgroundColor: isActive ? "#00ff88" : "transparent",
                color: isActive ? "#050805" : "#6b8a6b",
                border: "none",
                cursor: "pointer",
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
