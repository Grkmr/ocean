import { useOcelInfo, usePaginatedEvents } from "@/hooks/api"
import { Button, Form, Table } from "react-bootstrap"
import Pagination from "./Pagination"
import { useForm, useFieldArray } from "react-hook-form"
import { EventFilter } from "@/src/api/generated/types.gen";
import { useState } from "react";


const EditorFilterForm = () => {
  const {
    register,
    handleSubmit,
    control,
    reset,
  } = useForm<EventFilter>({
    defaultValues:
    {
      time_span:
        { start: null, end: null },
      activity_names: null,
      object_counts: [],
    }
  });

  const [filter, setFilter] = useState<EventFilter>({})
  const { data: paginatedEvents } = usePaginatedEvents({ filter })
  const { data: ocelInfo } = useOcelInfo({ filter: {} })

  const events = paginatedEvents?.data

  const { fields: objectCountFields, append, remove } = useFieldArray({
    control,
    name: "object_counts",
  });


  return <>

    <Form onSubmit={handleSubmit((data) => {
      setFilter(data)
    })}>
      <Form.Group className="mb-3">
        <Form.Label>Start Time</Form.Label>
        <Form.Control
          type="datetime-local"
          {...register("time_span.start", {
            setValueAs: (value) => value ? new Date(value).toISOString() : value,
          })}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>End Time</Form.Label>
        <Form.Control
          type="datetime-local"
          {...register("time_span.end", {
            setValueAs: (value) => value ? new Date(value).toISOString() : value,
          })}
        />
      </Form.Group>

      {/* Activity Names */}
      <Form.Group className="mb-3">
        <Form.Label>Activity Names</Form.Label>
        <Form.Select
          multiple
          {...register("activity_names")}
          aria-label="Select activity names"
        >
          {ocelInfo?.activities.map(({ activity }) => (
            <option key={activity} value={activity}>
              {activity}
            </option>
          ))}
        </Form.Select>
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Object Count Filters</Form.Label>
        {objectCountFields.map((field, index) => (
          <div key={field.id} className="border p-3 rounded mb-3">
            <Form.Group className="mb-2">
              <Form.Label>Field Name</Form.Label>
              <Form.Select {...register(`object_counts.${index}.field_name`)}>
                {ocelInfo?.object_summaries.map(({ object_type }) => (
                  <option key={object_type} value={object_type}>
                    {object_type}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-2">
              <Form.Label>Filter</Form.Label>
              <Form.Select {...register(`object_counts.${index}.filter` as const)}>
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
                {...register(`object_counts.${index}.value` as const, {
                  valueAsNumber: true,
                })}
              />
            </Form.Group>

            <Button variant="danger" onClick={() => remove(index)}>
              Remove
            </Button>
          </div>
        ))}
        <Button
          variant="outline-primary"
          onClick={() =>
            append({ type: "numerical", field_name: "", filter: "eq", value: 0 })
          }
        >
          + Add Object Count Filter
        </Button>
      </Form.Group>
      <Button onClick={() => reset()}>Clear</Button>
      <Button type="submit" variant={"success"}>Apply Filters</Button>
    </Form>
    {events && <><Table>
      <thead>
        <th>#</th>
        <th>Activity</th>
        <th>Timestamp</th>
        {events[0] && Object.keys(events[0].attr).map((key) => <th>{key}</th>)}
      </thead>
      <tbody>
        {events.map(({ id, timestamp, attr, activity }) => <tr>
          <td>{id}</td>
          <td>{activity}</td>
          <td>{timestamp}</td>
          {events[0] && Object.values(attr).map((data) => <td>{data as string}</td>)}
        </tr>)}
      </tbody>
    </Table>
      <Pagination totalPages={paginatedEvents.totalPages} /></>}

  </ >

}

export default EditorFilterForm
