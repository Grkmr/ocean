import GenericTable from "@/components/editor/GenericTable";
import Pagination from "@/components/editor/Pagination";
import { useOcelInfo, usePaginatedEvents } from "@/hooks/api"
import usePagination from "@/hooks/usePagination";
import { EventFilter } from "@/src/api/generated"
import { Api } from "@/src/openapi";
import { useOceanStore } from "@/src/zustand";
import { useEffect, useState } from "react"
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { PageProps } from "../_app";
import { Button } from "react-bootstrap";

const EventOverview: React.FC<PageProps> = ({ apiWrapper }) => {
  const { data, refetch } = useOcelInfo({ filter: { event_attributes: null } })
  useEffect(() => { console.log(data) }, [data])
  return <>
    <Button onClick={() => refetch()} >refetch</Button>

  </>
}


export default EventOverview;
