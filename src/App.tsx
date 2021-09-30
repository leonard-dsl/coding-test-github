/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback } from 'react'
import Container from 'react-bootstrap/Container'
import Form from 'react-bootstrap/Form'
import FloatingLabel from 'react-bootstrap/FloatingLabel'
import Spinner from 'react-bootstrap/Spinner'
import Accordion from 'react-bootstrap/Accordion'
import Pagination from 'react-bootstrap/Pagination'

import octokit from './services/octokit'

type PaginationProps = {
  page: number
  prev?: number
  next?: number
  first?: number
  last?: number
}

const App: React.FC = (): React.ReactElement => {
  const [search, setSearch] = useState<string>('')

  const [loading, setLoading] = useState<boolean>(false)
  const [repositories, setRepositories] = useState<Array<any>>([])
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [paginationRepo, setPaginationRepo] = useState<PaginationProps | null>(null)

  const [loadingContributors, setLoadingContributors] = useState<boolean>(false)
  const [contributors, setContributors] = useState<Array<any>>([])
  const [paginationContrib, setPaginationContrib] = useState<PaginationProps | null>(null)

  const generatePaginationData = (link = '', page: number): PaginationProps | null => {
    const paginationData: PaginationProps = { page }
    if (link) {
      link.split(',').forEach((pageLink) => {
        const match = pageLink.match(/&page=(\d+).*$/)
        if (match?.[0].includes('prev')) {
          paginationData.prev = +match?.[1]
        }
        if (match?.[0].includes('next')) {
          paginationData.next = +match?.[1]
        }
        if (match?.[0].includes('first')) {
          paginationData.first = +match?.[1]
        }
        if (match?.[0].includes('last')) {
          paginationData.last = +match?.[1]
        }
      })
    }
    return paginationData
  }

  const searchRepositories = (page = 1) => {
    setRepositories([])
    setPaginationRepo(null)
    setLoading(true)

    const getRepositories = async () => {
      try {
        const response = await octokit.request('GET /search/repositories', {
          q: `${search.trim()}+in:name`,
          sort: 'stars',
          per_page: 10,
          page,
        })
        setRepositories(response?.data?.items || [])
        setPaginationRepo(generatePaginationData(response?.headers?.link, page))
      } catch (error) {
        console.log('GET /search/repositories', error)
      } finally {
        setLoading(false)
      }
    }

    getRepositories()
  }

  const searchContributors = useCallback(
    (page = 1) => {
      setContributors([])
      setPaginationContrib(null)
      setLoadingContributors(true)

      const getContributors = async () => {
        try {
          const response = await octokit.request('GET /repos/{owner}/{repo}/contributors', {
            owner: selectedItem?.owner?.login,
            repo: selectedItem?.name,
            per_page: 10,
            page,
          })
          setContributors(response?.data || [])
          setPaginationContrib(generatePaginationData(response?.headers?.link, page))
        } catch (error) {
          console.log('GET /repos/{owner}/{repo}/contributors', error)
        } finally {
          setLoadingContributors(false)
        }
      }

      getContributors()
    },
    [selectedItem]
  )

  const onChange = (event: { target: { value: string } }) => {
    setSearch(event.target.value)
  }

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (search.trim()) {
      searchRepositories()
    }
  }

  const onClickRepository = (item: any) => {
    if (!selectedItem || (selectedItem && selectedItem?.id !== item?.id)) {
      setSelectedItem(item)
    }
  }

  useEffect(() => {
    if (selectedItem) {
      searchContributors()
    }
  }, [selectedItem, searchContributors])

  return (
    <Container fluid="sm" style={{ marginTop: 40, marginBottom: 40 }}>
      <Form onSubmit={onSubmit}>
        <FloatingLabel controlId="floatingInput" label="Search repositories" className="mb-3">
          <Form.Control
            type="text"
            value={search}
            placeholder="Search repositories"
            onChange={onChange}
            autoComplete="off"
          />
        </FloatingLabel>
      </Form>
      {loading && <Spinner animation="border" variant="light" />}
      {!loading && !!repositories.length && (
        <>
          <Accordion style={{ marginBottom: 20 }}>
            {repositories.map((repository) => (
              <Accordion.Item
                eventKey={repository?.id}
                key={repository?.id}
                onClick={(_) => onClickRepository(repository)}
              >
                <Accordion.Header>{repository?.full_name}</Accordion.Header>
                <Accordion.Body>
                  {repository?.id === selectedItem?.id && loadingContributors && (
                    <Spinner animation="border" />
                  )}
                  {repository?.id === selectedItem?.id &&
                    !loadingContributors &&
                    !!contributors.length && (
                      <>
                        <a href={repository?.html_url} target="_blank" rel="noreferrer">
                          {repository?.full_name}
                        </a>
                        {' contributors'}
                        <ul style={{ marginBottom: 20 }}>
                          {contributors.map((contributor) => (
                            <li key={contributor?.id}>
                              <a href={contributor?.html_url} target="_blank" rel="noreferrer">
                                {contributor?.login}
                              </a>
                            </li>
                          ))}
                        </ul>
                        <Pagination size="sm">
                          {paginationContrib?.first && (
                            <Pagination.First
                              onClick={() => searchContributors(paginationContrib?.first)}
                            />
                          )}
                          {paginationContrib?.prev && (
                            <Pagination.Prev
                              onClick={() => searchContributors(paginationContrib?.prev)}
                            />
                          )}
                          <Pagination.Item active>{paginationContrib?.page}</Pagination.Item>
                          {paginationContrib?.next && (
                            <Pagination.Next
                              onClick={() => searchContributors(paginationContrib?.next)}
                            />
                          )}
                          {paginationContrib?.last && (
                            <Pagination.Last
                              onClick={() => searchContributors(paginationContrib?.last)}
                            />
                          )}
                        </Pagination>
                      </>
                    )}
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
          <Pagination>
            {paginationRepo?.first && (
              <Pagination.First onClick={() => searchRepositories(paginationRepo?.first)} />
            )}
            {paginationRepo?.prev && (
              <Pagination.Prev onClick={() => searchRepositories(paginationRepo?.prev)} />
            )}
            <Pagination.Item active>{paginationRepo?.page}</Pagination.Item>
            {paginationRepo?.next && (
              <Pagination.Next onClick={() => searchRepositories(paginationRepo?.next)} />
            )}
            {paginationRepo?.last && (
              <Pagination.Last onClick={() => searchRepositories(paginationRepo?.last)} />
            )}
          </Pagination>
        </>
      )}
    </Container>
  )
}

export default App
