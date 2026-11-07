import { useStored } from "@/stored";
import { look, LOOK_NAMES, type Look } from "@/pixel/haru";
import { Haru } from "@/components/pixel/Haru";

const LABELS: Record<Look, string> = { villager: "Villager", wizard: "Wizard", knight: "Knight" };

// Pick one of Haru's three looks. The choice is kept in the browser.
export function LookPicker() {
  const current = useStored(look);
  return (
    <div className="looks" role="radiogroup" aria-label="Haru's look">
      {LOOK_NAMES.map((l) => (
        <button key={l} type="button" className="look" role="radio" aria-checked={current === l} onClick={() => look.set(l)}>
          <Haru look={l} size="sm" />
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
}
