import { Moon, Sun, Monitor, Check } from "lucide-react";
import type { Appearance } from "../lib/appearance";
import { Panel } from "./UI";
export function AppearancePicker({
  value,
  onChange,
}: {
  value: Appearance;
  onChange: (value: Appearance) => void;
}) {
  return (
    <Panel className="appearance-panel">
      <div>
        <h2>Make it feel like you.</h2>
        <p>Choose a look. Your focus stays the same.</p>
      </div>
      <div className="appearance-options" role="group" aria-label="Appearance">
        {(
          [
            { id: "light", name: "Light", icon: Sun },
            { id: "dark", name: "Dark", icon: Moon },
            { id: "system", name: "System", icon: Monitor },
          ] as const
        ).map(({ id, name, icon: Icon }) => (
          <button
            key={id}
            aria-pressed={value === id}
            onClick={() => onChange(id)}
          >
            <Icon size={18} />
            <span>{name}</span>
            {value === id && <Check size={14} />}
          </button>
        ))}
      </div>
    </Panel>
  );
}
