import React from "react";

interface DateRangePickerProps {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  label?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  from,
  to,
  onChange,
  label,
}) => {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}

      <div
        className="form-row"
        style={{ display: "flex", gap: 8, alignItems: "center" }}
      >
        <div style={{ flex: 1 }}>
          <label className="form-label" style={{ fontSize: 12, marginBottom: 2 }}>
            Da
          </label>
          <input
            type="date"
            className="form-input"
            value={from}
            onChange={(e) => onChange(e.target.value, to)}
          />
        </div>

        <div style={{ flex: 1 }}>
          <label className="form-label" style={{ fontSize: 12, marginBottom: 2 }}>
            A
          </label>
          <input
            type="date"
            className="form-input"
            value={to}
            onChange={(e) => onChange(from, e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default DateRangePicker;
