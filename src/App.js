import {useState, useRef} from 'react'
import client from './client'
import {ApolloProvider} from 'react-apollo'
import {SEARCH_REPOSITORIES, ADD_STAR, REMOVE_STAR} from "./graphql";
import {Query, Mutation} from 'react-apollo';

const StarButton = props => {
    const {query, first, last, before, after} = props.query;
    const totalCount = props.node.stargazers.totalCount
    const starCount = totalCount === 1 ? `1 star` : `${totalCount} stars`
    const viewerHasStarred = props.node.viewerHasStarred
    const StarStatus = ({handleToggleStar}) => {
        return (
            <button onClick={() => handleToggleStar({
                variables: {input: {starrableId: props.node.id}}
            })}> {starCount} | {viewerHasStarred ? 'starred' : '-'}</button>
        )
    }
    return (
        <Mutation mutation={viewerHasStarred ? REMOVE_STAR : ADD_STAR}
                  refetchQueries={[
                      {
                          query: SEARCH_REPOSITORIES,
                          variables: {query, first, last, before, after}
                      }
                  ]}
        >

            {
                toggleStar => <StarStatus handleToggleStar={toggleStar}/> //toggleStarにはmutationが入ってくる
            }
        </Mutation>
    )
}

const PER_PAGE = 5;
const VARIABLES = {
    first: PER_PAGE,
    after: null,
    before: null,
    last: null,
    query: "フロントエンドエンジニア"
}

const App = () => {
    const [state, setState] = useState(VARIABLES)
    const {query, first, last, before, after} = state;
    const setPage = (value) => {
        setState({
            ...state,
            query: value
        })
    }
    const inputElement = useRef(null)

    const submitRequest = (e) => {
        e.preventDefault()
        setPage(inputElement.current.value)
    }
    return (

        <ApolloProvider client={client}>
            <h1> - Application With GraphQL API - </h1>
            <form action="" onSubmit={submitRequest}>
                <input type="text" ref={inputElement}
                       placeholder="search repositories"/>&nbsp;
                <input type="submit" value="search"/>
            </form>
            <Query query={SEARCH_REPOSITORIES}
                   variables={{query, first, last, before, after}}
            >
                {
                    ({loading, error, data}) => {
                        if (loading) return 'Loading...'
                        if (error) return `Error! ${error.message}`
                        const repositoryCount = data.search.repositoryCount;
                        const goNext = () => {
                            setState({
                                ...state,
                                first: PER_PAGE,
                                after: data.search.pageInfo.endCursor, //一番最後のカーソル情報
                                last: null,
                                before: null
                            })
                        }
                        const goPrevious = () => {
                            setState({
                                ...state,
                                first: null,
                                after: null,
                                last: PER_PAGE,
                                before: data.search.pageInfo.startCursor//一番最初のカーソル情報
                            })
                        }
                        return (
                            <>
                                <h2>Github Repositories Search Results
                                    - {repositoryCount === 1 ? '1 repository' : `${repositoryCount} repositories`}</h2>
                                <ul>
                                    {data.search.edges.map(item => {
                                        const node = item.node;
                                        return (
                                            <li key={node.id}>
                                                <a href={node.url}
                                                   target="_blank"
                                                   rel="noreferrer">{node.name}</a>
                                                &nbsp;
                                                <StarButton
                                                    node={node}
                                                    query={{
                                                        query,
                                                        first,
                                                        last,
                                                        before,
                                                        after
                                                    }}
                                                />
                                            </li>)
                                    })}
                                </ul>
                                {
                                    data.search.pageInfo.hasPreviousPage === true ?
                                        <button
                                            onClick={goPrevious}>PREV</button> : null
                                }
                                {
                                    data.search.pageInfo.hasNextPage === true ?
                                        <button
                                            onClick={goNext}>NEXT</button> : null
                                }

                            </>
                        )
                    }
                }
            </Query>
        </ApolloProvider>
    );
}

export default App;
