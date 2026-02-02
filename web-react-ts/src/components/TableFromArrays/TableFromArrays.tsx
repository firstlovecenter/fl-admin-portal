'use client'

import { MemberContext } from 'contexts/MemberContext'
import React, { useContext } from 'react'
import { Table } from 'react-bootstrap'
import PlaceholderCustom from '../Placeholder'
import './TableFromArrays.css'

export type TableArray = ((string | JSX.Element)[] | (string | number)[])[]

type TableFromArrayProps = {
  tableArray: ((string | JSX.Element)[] | (string | number)[])[]
  loading: boolean
}

const TableFromArrays = ({ tableArray, loading }: TableFromArrayProps) => {
  const { theme } = useContext(MemberContext)

  return (
    <Table variant={theme} striped bordered>
      <tbody>
        {tableArray?.map((row, i: number) => (
          <tr key={i}>
            {row.map((col, j: number) => (
              <PlaceholderCustom
                key={j}
                as="td"
                xs={12}
                loading={loading && j % 2 === 0}
                className="td-placeholder"
              >
                <td>{col}</td>
              </PlaceholderCustom>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

export default TableFromArrays
