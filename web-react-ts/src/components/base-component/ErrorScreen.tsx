import { showUserReportDialog } from 'global-utils'
import useModal from 'hooks/useModal'
import React from 'react'
import { Button } from 'components/ui/button'
import { Card, CardHeader, CardContent, CardFooter } from 'components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
} from 'components/ui/dialog'
import './ErrorScreen.css'

export interface ApolloError {
  name: string
  graphQLErrors: {
    message: string
    locations: {
      line: number
      column: number
    }[]
    path: (string | number)[]
    extensions: {
      code: string
      exception: {
        message: string
        stacktrace: string[]
      }
    }
  }[]
  protocolErrors: unknown[]
  clientErrors: unknown[]
  networkError: {
    name: string
    response: unknown
    statusCode: number
    result: {
      errorMessage?: string
      errors: {
        message: string
        extensions: {
          code: string
          exception: {
            stacktrace: string[]
          }
        }
      }[]
    }
  } | null
  message: string
}

export interface FirebaseError {
  code: string
  message: string
  name: string
  stack: string
}

interface ErrorScreenProps {
  error: ApolloError | Error | undefined | FirebaseError
}

const ErrorPage = ({ error }: ErrorScreenProps) => {
  const { show, handleShow, handleClose } = useModal()

  const { graphQLErrors, networkError } = error as ApolloError

  if (graphQLErrors)
    graphQLErrors.forEach(({ message, locations, path }) =>
      // eslint-disable-next-line no-console
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(
          locations
        )}, Path: ${JSON.stringify(path)}`
      )
    )

  if (networkError)
    // eslint-disable-next-line no-console
    console.error(`[Network error]: ${JSON.stringify(networkError)}`)

  return (
    <>
      <div className="min-h-screen text-center mt-5">
        <p className="my-5">There seems to be an error loading data</p>
        <Card className="text-center">
          <CardHeader>
            <h4>{error?.name}</h4>
          </CardHeader>
          <CardContent className="py-4">
            {graphQLErrors?.length > 0 && (
              <>
                {graphQLErrors.map(
                  ({ message, locations, path, extensions }) => (
                    <>
                      <p className="font-bold text-destructive">{`code: ${extensions.code}`}</p>
                      <p>{`Location: ${JSON.stringify(locations)}`}</p>
                      <p className="mb-3">{`Path: ${JSON.stringify(path)}`}</p>
                      <p className="truncate">
                        {`[GraphQL error]: Message: ${message}`}
                      </p>
                    </>
                  )
                )}
              </>
            )}

            {!!networkError && (
              <>
                {networkError.result?.errors?.map((error) => (
                  <>
                    <p className="font-bold text-destructive">{`code: ${error.extensions.code}`}</p>
                    <p className="truncate">
                      {`[Network error]: ${error?.message}`}
                    </p>
                  </>
                ))}
                {!networkError.result?.errors?.length && (
                  <>
                    <p className="font-bold text-destructive">{`code: ${networkError?.statusCode}`}</p>
                    <p className="truncate">
                      {`[Network error]: ${networkError?.result?.errorMessage}`}
                    </p>
                  </>
                )}
              </>
            )}
            <Dialog open={show} onOpenChange={(open) => !open && handleClose()}>
              <DialogContent>
                <DialogHeader>
                  <h2 className="text-lg font-semibold">{error?.name}</h2>
                </DialogHeader>
                <p className="text-blue-400 text-sm">{JSON.stringify(error)}</p>
                <DialogFooter>
                  <Button variant="default" onClick={handleClose}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>

          <CardFooter className="flex-col">
            <div className="w-full">
              <p className="font-bold pb-2">
                Click the <span className="text-destructive">Show Details</span>{' '}
                Button and take a screenshot to provide more details to the
                support team
              </p>
              <Button variant="destructive" onClick={handleShow}>
                Show Details
              </Button>
              <div>
                <Button
                  variant="outline"
                  className="my-2 text-yellow-500 border-yellow-500"
                  onClick={showUserReportDialog}
                >
                  Send Crash Report
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>

        <Button className="mt-5" onClick={() => window.location.reload()}>
          Reload Page
        </Button>
      </div>
    </>
  )
}

export default ErrorPage
