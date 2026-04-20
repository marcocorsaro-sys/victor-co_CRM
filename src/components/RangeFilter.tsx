import React from "react";

interface RangeFilterProps {
  min: string;
  max: string;
  onChange: (min: string, max: string) => void;
  label: string;
}

const RangeFilter: React.FC<RangeFilterProps> = ({
  min,
  max,
  onChange,
  label,
}) => {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>

      <div
        className="form-row"
        style={{ display: "flex", gap: 8, alignItems: "center" }}
      >
        <div style={{ flex: 1 }}>
          <label className="form-label" style={{ fontSize: 12, marginBottom: 2 }}>
            Min &euro;
          </label>
          <input
            type="number"
            className="form-input"
            placeholder="0"
            value={min}
            onChange={(e) => onChange(e.target.value, max)}
            min="0"
            step="any"
          />
        </div>

        <div style={{ flex: 1 }}>
          <label className="form-label" style={{ fontSize: 12, marginBottom: 2 }}>
            Max &euro;
          </label>
          <input
            type="number"
            className="form-input"
            placeholder="0"
            value={max}
            onChange={(e) => onChange(min, e.target.value)}
            min="0"
            step="any"
          />
        </div>
      </div>
    </div>
  );
};

export default RangeFilter;
