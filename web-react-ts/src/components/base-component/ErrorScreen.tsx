'use client'

import { showUserReportDialog } from 'global-utils'
import useModal from 'hooks/useModal'
import React from 'react'
import { Button, Card, Container, Modal } from 'react-bootstrap'
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
      <Container className="100vh text-center mt-5">
        <p className="my-5">There seems to be an error loading data</p>
        <Card className="text-center">
          <Card.Header className="p3-4">
            <h4>{error?.name}</h4>
          </Card.Header>
          <Card.Body className="py-4">
            {graphQLErrors?.length > 0 && (
              <>
                {graphQLErrors.map(
                  ({ message, locations, path, extensions }) => (
                    <>
                      <p className="fw-bold text-danger">{`code: ${extensions.code}`}</p>
                      <p>{`Location: ${JSON.stringify(locations)}`}</p>
                      <p className="mb-3">{`Path: ${JSON.stringify(path)}`}</p>
                      <Card.Text className="text-truncate truncate-2-lines">
                        {`[GraphQL error]: Message: ${message}`}
                      </Card.Text>
                    </>
                  )
                )}
              </>
            )}

            {!!networkError && (
              <>
                {networkError.result?.errors?.map((error) => (
                  <>
                    <Card.Text className="fw-bold text-danger">{`code: ${error.extensions.code}`}</Card.Text>
                    <Card.Text className="text-truncate">
                      {`[Network error]: ${error?.message}`}
                    </Card.Text>
                  </>
                ))}
                {!networkError.result?.errors?.length && (
                  <>
                    <Card.Text className="fw-bold text-danger">{`code: ${networkError?.statusCode}`}</Card.Text>
                    <Card.Text className="text-truncate">
                      {`[Network error]: ${networkError?.result?.errorMessage}`}
                    </Card.Text>
                  </>
                )}
              </>
            )}
            <Modal show={show} onHide={handleClose} centered scrollable>
              <Modal.Header closeButton>{error?.name}</Modal.Header>
              <Modal.Body>
                <p className="text-info">{JSON.stringify(error)}</p>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="primary" onClick={handleClose}>
                  Close
                </Button>
              </Modal.Footer>
            </Modal>
          </Card.Body>

          <Card.Footer>
            <Container>
              <p className="fw-bold pb-2">
                Click the <span className="text-danger">Show Details</span>{' '}
                Button and take a screenshot to provide more details to the
                support team
              </p>
              <Button variant="danger" onClick={handleShow}>
                Show Details
              </Button>
              <div>
                <Button
                  variant="outline-warning"
                  className="my-2"
                  onClick={showUserReportDialog}
                >
                  Send Crash Report
                </Button>
              </div>
            </Container>
          </Card.Footer>
        </Card>

        <Button className="mt-5" onClick={() => window.location.reload()}>
          Reload Page
        </Button>
      </Container>
    </>
  )
}

export default ErrorPage
