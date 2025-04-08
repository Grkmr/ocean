import { useOcelInfo, usePaginatedEvents } from "@/hooks/api"
import { Button, Form, Placeholder, Table } from "react-bootstrap"
import Pagination from "./Pagination"
import { useForm } from "react-hook-form"
import { EventFilter } from "@/src/api/generated/types.gen";
import { useState } from "react";

type FormValues = {
  startDate: string;
  endDate: string;
  activities: string[];
};
const allActivities = ['Running', 'Swimming', 'Cycling', 'Yoga'];

const EditorFilterForm = () => {
  const [filter, setFilter] = useState<EventFilter>({
    time_span: null,
    object_types: null,
    object_counts: null,
    activity_names: null,
    event_attributes: null,
    object_attributes_values: null,
  })
  const { data: paginatedEvents } = usePaginatedEvents({ filter })
  const { data: ocelInfo } = useOcelInfo()
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormValues>();

  const events = paginatedEvents?.data


  const onSubmit = (data: FormValues) => {
    console.log('Form Data:', data);
  };

  const selectedActivities = watch('activities', []) ?? [];


  return <>

    <Form onSubmit={handleSubmit(onSubmit)}>
      {/* Start Date */}
      <Form.Group controlId="startDate" className="mb-3">
        <Form.Label>Start Date</Form.Label>
        <Form.Control
          type="date"
          {...register('startDate', { required: 'Start date is required' })}
          isInvalid={!!errors.startDate}
        />
        <Form.Control.Feedback type="invalid">
          {errors.startDate?.message}
        </Form.Control.Feedback>
      </Form.Group>

      {/* End Date */}
      <Form.Group controlId="endDate" className="mb-3">
        <Form.Label>End Date</Form.Label>
        <Form.Control
          type="date"
          {...register('endDate', {
            required: 'End date is required',
            validate: (value) => {
              const start = watch('startDate');
              return (
                !start || value >= start || 'End date must be after start date'
              );
            },
          })}
          isInvalid={!!errors.endDate}
        />
        <Form.Control.Feedback type="invalid">
          {errors.endDate?.message}
        </Form.Control.Feedback>
      </Form.Group>

      {/* Activities */}
      <Form.Group controlId="activities" className="mb-3">
        <Form.Label>Activities</Form.Label>
        {allActivities.map((activity) => (
          <Form.Check
            key={activity}
            type="checkbox"
            label={activity}
            value={activity}
            {...register('activities')}
          />
        ))}
        {errors.activities && (
          <Form.Text className="text-danger">
            {errors.activities.message}
          </Form.Text>
        )}
      </Form.Group>

      <Button type="submit">Submit</Button>
    </Form>
    {events && <><Table>
      <thead>
        <th>#</th>
        <th>Activity</th>
        <th>Timestamp</th>
        {Object.keys(events[0].attr).map((key) => <th>{key}</th>)}
      </thead>
      <tbody>
        {events.map(({ id, timestamp, attr, activity }) => <tr>
          <td>{id}</td>
          <td>{activity}</td>
          <td>{timestamp}</td>
          {Object.values(attr).map((data) => <td>{data as string}</td>)}
        </tr>)}
      </tbody>
    </Table>
      <Pagination totalPages={paginatedEvents.totalPages} /></>}

  </ >

}

export default EditorFilterForm
