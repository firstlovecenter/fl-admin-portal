import { InMemoryCache, InMemoryCacheConfig } from '@apollo/client'

const buildApolloCache = (config?: InMemoryCacheConfig): InMemoryCache =>
  new InMemoryCache(config)

export default buildApolloCache
