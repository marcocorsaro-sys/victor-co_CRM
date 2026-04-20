import React, { useState, useRef, useEffect } from "react";

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
  label?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selected,
  onChange,
  placeholder,
  label,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const triggerText =
    selected.length === 0
      ? placeholder
      : `${selected.length} selezionat${selected.length === 1 ? "o" : "i"}`;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {label && (
        <label className="form-label" style={{ marginBottom: 4, display: "block" }}>
          {label}
        </label>
      )}

      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          background: "var(--s1)",
          border: "1px solid var(--bd)",
          borderRadius: 6,
          padding: "8px 12px",
          color: selected.length > 0 ? "var(--w)" : "var(--g)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: 38,
          userSelect: "none",
        }}
      >
        <span>{triggerText}</span>
        <span style={{ marginLeft: 8, fontSize: 10, color: "var(--g)" }}>
          {open ? "\u25B2" : "\u25BC"}
        </span>
      </div>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 50,
            background: "var(--s1)",
            border: "1px solid var(--bd)",
            borderRadius: 6,
            marginTop: 4,
            maxHeight: 220,
            overflowY: "auto",
            boxShadow: "0 4px 12px rgba(0,0,0,.4)",
          }}
        >
          {options.map((opt) => (
            <label
              key={opt.value}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                cursor: "pointer",
                color: "var(--w)",
                borderBottom: "1px solid var(--bd)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--s2)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={() => toggle(opt.value)}
                style={{ accentColor: "var(--lime)" }}
              />
              <span>{opt.label}</span>
            </label>
          ))}

          {options.length === 0 && (
            <div style={{ padding: "12px", color: "var(--g)", textAlign: "center" }}>
              Nessuna opzione
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
