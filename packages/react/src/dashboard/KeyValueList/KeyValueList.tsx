import React from "react";
import { clsx } from "clsx";
import { Plus, Trash01 } from "@kozmos-ds/icons";
import { Button } from "../../components/Button/Button";
import { IconButton } from "../../components/IconButton/IconButton";
import { Input } from "../../components/Input/Input";
import { NumberInput } from "../../components/NumberInput/NumberInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/Select/Select";
import { Switch } from "../../components/Switch/Switch";

/** What a row's value is: words, JSON, a number or on and off. */
export type KeyValueType = "text" | "json" | "number" | "boolean";

/**
 * One row: a name, its value's type, and the value, a string for text and
 * JSON, a number (or `null`, empty) for a number, a boolean for a boolean.
 * `id` is the product's, stable while the row lives. `mixed` marks a value
 * that differs across a multi-selection (GAP-153).
 */
export interface KeyValueRow {
  id: string;
  name: string;
  type: KeyValueType;
  value: string | number | boolean | null;
  mixed?: boolean;
}

const TYPES: KeyValueType[] = ["text", "json", "number", "boolean"];
const TYPE_LABELS: Record<KeyValueType, string> = {
  text: "Text",
  json: "JSON",
  number: "Number",
  boolean: "Boolean",
};

/** A value carried into another type, as far as it can be. */
function convert(value: KeyValueRow["value"], type: KeyValueType) {
  if (type === "boolean") return value === true;
  if (type === "number") {
    const number = typeof value === "number" ? value : Number(value);
    return value === null || value === "" || !Number.isFinite(number)
      ? null
      : number;
  }
  return value === null ? "" : String(value);
}

const isJson = (text: string) => {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
};

let made = 0;
const newId = () => `kozmos-key-value-${Date.now().toString(36)}-${made++}`;

export interface KeyValueListProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "defaultValue" | "onChange"
> {
  /** The rows, for a product that holds them. */
  value?: KeyValueRow[];
  /** The rows a list that holds its own starts with. Default none. */
  defaultValue?: KeyValueRow[];
  /** Called with every row after each add, edit and delete. */
  onValueChange?: (rows: KeyValueRow[]) => void;
  /** A new row's id. Default a unique string. */
  createId?: () => string;
  /** The add button's words. Default "Add field". */
  addLabel?: string;
  /** A row's name, each control named after it. Default `Field <n>`. */
  rowLabel?: (index: number) => string;
  /** A row's delete button's name. Default `Remove <row>`. */
  removeLabel?: (row: string) => string;
  /** The types' words. Defaults "Text", "JSON", "Number", "Boolean". */
  typeLabels?: Partial<Record<KeyValueType, string>>;
  /** Said under a JSON value that does not parse. */
  invalidJsonLabel?: string;
  /** Default "Multiple values". */
  mixedLabel?: string;
  /** Per row id, going back to its several values: give it for one that was. */
  onResetMixed?: Record<string, () => void>;
  disabled?: boolean;
}

/**
 * A key–value list (CLOUD-UI-004, decision 178): one list of repeatable
 * rows, each a name, a type (Text, JSON, Number or Boolean), a value drawn
 * for its type (a text field, a number field, a switch) and a delete
 * button, with "Add field" at its end. Every control is named for its row
 * ("Field 2 name"). Adding puts focus in the new row's name; deleting puts
 * it in the next row's name, or on the add button after the last. A
 * Dashboard module (decision 183).
 */
const KeyValueList = React.forwardRef<HTMLDivElement, KeyValueListProps>(
  (
    {
      className,
      value: valueProp,
      defaultValue = [],
      onValueChange,
      createId = newId,
      addLabel = "Add field",
      rowLabel = (index) => `Field ${index + 1}`,
      removeLabel = (row) => `Remove ${row}`,
      typeLabels,
      invalidJsonLabel = "Not valid JSON.",
      mixedLabel = "Multiple values",
      onResetMixed = {},
      disabled,
      ...props
    },
    ref,
  ) => {
    const [held, setHeld] = React.useState(defaultValue);
    const rows = valueProp ?? held;
    const names = React.useRef(new Map<string, HTMLInputElement>());
    const add = React.useRef<HTMLButtonElement>(null);
    // Where focus goes once the rows have drawn: a row's name, or the add
    // button (null).
    const [focus, setFocus] = React.useState<string | null | undefined>();
    // A product that commits the new row a tick later draws it later: the
    // pending focus waits for the row's name to exist.
    React.useEffect(() => {
      if (focus === undefined) return;
      const target = focus === null ? add.current : names.current.get(focus);
      if (!target) return;
      target.focus();
      setFocus(undefined);
    }, [focus, rows]);

    const change = (next: KeyValueRow[]) => {
      if (valueProp === undefined) setHeld(next);
      onValueChange?.(next);
    };
    const edit = (id: string, patch: Partial<KeyValueRow>) =>
      change(rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));

    return (
      <div
        ref={ref}
        className={clsx("kozmos-key-value-list", className)}
        {...props}
      >
        {rows.map((row, index) => {
          const label = rowLabel(index);
          const json =
            row.type === "json" &&
            !row.mixed &&
            typeof row.value === "string" &&
            row.value.trim() !== "" &&
            !isJson(row.value);
          const mixed = row.mixed ?? false;
          const reset = onResetMixed[row.id];
          return (
            <div
              key={row.id}
              role="group"
              aria-label={label}
              className="kozmos-key-value-row"
            >
              <Input
                ref={(node) => {
                  if (node) names.current.set(row.id, node);
                  else names.current.delete(row.id);
                }}
                aria-label={`${label} name`}
                value={row.name}
                disabled={disabled}
                onChange={(event) => edit(row.id, { name: event.target.value })}
              />
              <Select
                value={row.type}
                disabled={disabled}
                onValueChange={(type) => {
                  const next = type as KeyValueType;
                  edit(row.id, { type: next, value: convert(row.value, next) });
                }}
              >
                <SelectTrigger aria-label={`${label} type`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {typeLabels?.[type] ?? TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* The value and the delete button are placed by class: a Select
                  inside a <form> adds a hidden native select to the row, so
                  the children's order is not the layout's. */}
              <div
                className={clsx(
                  "kozmos-key-value-value",
                  row.type === "boolean" && "kozmos-key-value-value-boolean",
                )}
              >
                {row.type === "boolean" ? (
                  <>
                    <Switch
                      aria-label={`${label} value`}
                      // A switch has no third state: a mixed one says so,
                      // beside the track, as the switch's description.
                      description={mixed ? mixedLabel : undefined}
                      checked={row.value === true}
                      disabled={disabled}
                      onCheckedChange={(checked) =>
                        edit(row.id, { value: checked, mixed: false })
                      }
                    />
                  </>
                ) : row.type === "number" ? (
                  <NumberInput
                    aria-label={`${label} value`}
                    // Any decimal is a value: the default step of 1 would make
                    // 2.5 invalid and block the form's submit. Core's steppers
                    // call stepUp(), which a step of "any" refuses, so the
                    // field draws none rather than two dead buttons.
                    step="any"
                    showSteppers={false}
                    value={typeof row.value === "number" ? row.value : ""}
                    disabled={disabled}
                    mixed={mixed}
                    mixedLabel={mixedLabel}
                    onResetMixed={reset}
                    onValueChange={(value) =>
                      edit(row.id, { value, mixed: false })
                    }
                  />
                ) : (
                  <Input
                    aria-label={`${label} value`}
                    value={typeof row.value === "string" ? row.value : ""}
                    disabled={disabled}
                    error={json ? invalidJsonLabel : undefined}
                    mixed={mixed}
                    mixedLabel={mixedLabel}
                    onResetMixed={reset}
                    onChange={(event) =>
                      edit(row.id, { value: event.target.value, mixed: false })
                    }
                  />
                )}
              </div>
              <IconButton
                emotion="danger"
                className="kozmos-key-value-remove"
                aria-label={removeLabel(label)}
                disabled={disabled}
                onClick={() => {
                  setFocus(rows[index + 1]?.id ?? null);
                  change(rows.filter((other) => other.id !== row.id));
                }}
              >
                <Trash01 aria-hidden="true" />
              </IconButton>
            </div>
          );
        })}
        <Button
          ref={add}
          type="button"
          variant="ghost"
          size="sm"
          className="kozmos-key-value-add"
          disabled={disabled}
          onClick={() => {
            const id = createId();
            setFocus(id);
            change([...rows, { id, name: "", type: "text", value: "" }]);
          }}
        >
          <Plus aria-hidden="true" />
          {addLabel}
        </Button>
      </div>
    );
  },
);
KeyValueList.displayName = "KeyValueList";

export { KeyValueList };
