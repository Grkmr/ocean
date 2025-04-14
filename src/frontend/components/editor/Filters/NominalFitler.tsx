import { Button, Form } from "react-bootstrap"
import { UseFormRegister } from "react-hook-form"

const NominalFilter: React.FC<{ id: string, fieldNames: string[], fieldOptions: string[], register: UseFormRegister<any>, remove: () => void }> = ({ id, register, remove, fieldOptions, fieldNames }) => {


  return <div key={id} className="border p-3 rounded mb-3">
    <Form.Group className="mb-2">
      <Form.Label>Field Name</Form.Label>
      <Form.Select {...register(`${id}.field_name`)}>
        {fieldNames.map((fieldName) => (
          <option key={fieldName} value={fieldName}>
            {fieldName}
          </option>
        ))}
      </Form.Select>
    </Form.Group>
    <Form.Group className="mb-3">
      <Form.Label>Activity Names</Form.Label>
      <Form.Select
        multiple
        {...register("activity_names")}
        aria-label="Select activity names"
      >
        {fieldOptions.map((fieldOption) => (
          <option key={fieldOption} value={fieldOption}>
            {fieldOption}
          </option>
        ))}
      </Form.Select>
    </Form.Group>
    <Button variant="danger" onClick={remove}>
      Remove
    </Button>
  </div>
}


export default NominalFilter;
