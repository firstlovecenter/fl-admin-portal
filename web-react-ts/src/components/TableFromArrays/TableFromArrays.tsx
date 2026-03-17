import { MemberContext } from 'contexts/MemberContext'
import React, { useContext } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from 'components/ui/table'
import { Skeleton } from 'components/ui/skeleton'
import './TableFromArrays.css'

export type TableArray = ((string | JSX.Element)[] | (string | number)[])[]

type TableFromArrayProps = {
  tableArray: ((string | JSX.Element)[] | (string | number)[])[]
  loading: boolean
}

const TableFromArrays = ({ tableArray, loading }: TableFromArrayProps) => {
  const { theme } = useContext(MemberContext)

  return (
    <Table className={`border ${theme === 'dark' ? 'border-zinc-700' : 'border-gray-200'}`}>
      <TableBody>
        {tableArray?.map((row, i: number) => (
          <TableRow key={i} className={theme === 'dark' ? 'border-zinc-700 even:bg-zinc-800/50' : 'even:bg-gray-50'}>
            {row.map((col, j: number) => (
              <TableCell key={j} className={`p-3 border-r last:border-r-0 ${theme === 'dark' ? 'border-zinc-700' : 'border-gray-200'}`}>
                {loading && j % 2 === 0 ? (
                  <Skeleton className="h-4 w-full" />
                ) : (
                  col
                )}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default TableFromArrays
