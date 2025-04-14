import { Button, Form } from "react-bootstrap"
import { UseFormRegister } from "react-hook-form"


type NumericalField = {
  type: "numerical"
  fieldName: string
}

type NominalField = {
  type: "nominal"
  fieldName: string
  options: string[]
}

const NumericalFilter: React.FC<{ id: string, fieldOptions: string[], register: UseFormRegister<any>, remove: () => void }> = ({ id, register, remove, fieldOptions }) => {


  return <div key={id} className="border p-3 rounded mb-3">
    <Form.Group className="mb-2">
      <Form.Label>Field Name</Form.Label>
      <Form.Select {...register(`${id}.field_name`)}>
        {fieldOptions.map((fieldOption) => (
          <option key={fieldOption} value={fieldOption}>
            {fieldOption}
          </option>
        ))}
      </Form.Select>
    </Form.Group>

    <Form.Group className="mb-2">
      <Form.Label>Filter</Form.Label>
      <Form.Select {...register(`${id}.filter` as const)}>
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
        {...register(`${id}.value` as const, {
          valueAsNumber: true,
        })}
      />
    </Form.Group>

    <Button variant="danger" onClick={remove}>
      Remove
    </Button>
  </div>
}


export default NumericalFilter;
