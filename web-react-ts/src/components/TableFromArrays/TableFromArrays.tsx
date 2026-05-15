import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from 'components/ui/table'
import PlaceholderCustom from '../Placeholder'
import './TableFromArrays.css'

export type TableArray = ((string | JSX.Element)[] | (string | number)[])[]

type TableFromArrayProps = {
  tableArray: ((string | JSX.Element)[] | (string | number)[])[]
  loading: boolean
}

const TableFromArrays = ({ tableArray, loading }: TableFromArrayProps) => {
  return (
    <Table className="border [&_td]:border [&_td]:border-border [&_tr:nth-child(even)]:bg-muted/40">
      <TableBody>
        {tableArray?.map((row, i: number) => (
          <TableRow key={i}>
            {row.map((col, j: number) => (
              <TableCell key={j} className="td-placeholder">
                <PlaceholderCustom
                  as="span"
                  xs={12}
                  loading={loading && j % 2 === 0}
                >
                  {col}
                </PlaceholderCustom>
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default TableFromArrays
