
import { Button, Form } from "react-bootstrap";
import { Control, useFieldArray, UseFormRegister, useWatch } from "react-hook-form";

type NumericalField = {
  type: "numerical";
  fieldName: string;
};

type NominalField = {
  type: "nominal";
  fieldName: string;
  options: string[];
};

const SpecificFilter: React.FC<{
  control: Control;
  filter_name: string;
  filterFields: (NumericalField | NominalField)[];
  register: UseFormRegister<any>;
}> = ({ control, filter_name, register, filterFields }) => {

  const { fields, append, remove } = useFieldArray({
    control,
    name: filter_name,
  });

  const watchFilters = useWatch({ control, name: filter_name });

  return (
    <Form.Group className="mb-3">
      <Form.Label>Filters</Form.Label>

      {fields.map((field, index) => {
        const fieldPath = `${filter_name}.${index}`;

        const selectedFieldName = watchFilters?.[index]?.field_name;
        const selectedField = filterFields.find(f => f.fieldName === selectedFieldName);

        return (
          <div key={field.id} className="border p-3 rounded mb-3">
            <Form.Group className="mb-2">
              <Form.Label>Field Name</Form.Label>
              <Form.Select {...register(`${fieldPath}.field_name`)}>
                {filterFields.map(f => (
                  <option key={f.fieldName} value={f.fieldName}>
                    {f.fieldName}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            {selectedField?.type === "numerical" && (
              <>
                <Form.Group className="mb-2">
                  <Form.Label>Filter</Form.Label>
                  <Form.Select {...register(`${fieldPath}.filter`)}>
                    <option value="eq">= Equal</option>
                    <option value="lt">&lt; Less Than</option>
                    <option value="gt">&gt; Greater Than</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label>Value</Form.Label>
                  <Form.Control
                    type="number"
                    step="any"
                    {...register(`${fieldPath}.value`, { valueAsNumber: true })}
                  />
                </Form.Group>
              </>
            )}

            {selectedField?.type === "nominal" && (
              <>
                <Form.Label>Options</Form.Label>
                {selectedField.options.map(option => (
                  <Form.Check
                    key={option}
                    type="checkbox"
                    label={option}
                    value={option}
                    {...register(`${fieldPath}.value`)}
                  />
                ))}
              </>
            )}

            <Button variant="danger" onClick={() => remove(index)}>
              Remove
            </Button>
          </div>
        );
      })}

      <Button
        variant="outline-primary"
        onClick={() =>
          append({
            field_name: filterFields[0]?.fieldName ?? "",
            filter: "eq",
            value: [],
          })
        }
      >
        + Add Filter
      </Button>
    </Form.Group>
  );
};

export default SpecificFilter;
