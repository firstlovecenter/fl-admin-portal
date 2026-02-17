import axios from 'axios'
import { getHumanReadableDate } from 'jd-date-utils'
import { Context } from '../utils/neo4j-types'
import { Member } from '../utils/types'
import { isAuth, rearrangeCypherObject, throwToSentry } from '../utils/utils'
// This file is currently empty but needed for build compatibility
// Directory mutation resolvers are handled through make-remove-servants.ts
// and other directory request handlers

const directoryMutation = {}

export default directoryMutation