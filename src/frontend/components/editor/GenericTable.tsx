import { EventFilter, OcelEvent } from "@/src/api/generated"
import { Table } from "react-bootstrap"



const GenericTable: React.FC<{ events: OcelEvent[] }> = ({ events }) => {
  return <Table>
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


}


export default GenericTable;
