import {
  MakeServant,
  RemoveServant,
} from '../../directory/make-remove-servants'
import { permitAdmin } from '../../permissions'
import { Context } from '../../utils/neo4j-types'

const sheepSeekingMutations = {
  MakeStreamSheepSeeker: async (object: never, args: never, context: Context) =>
    MakeServant(
      context,
      args,
      [...permitAdmin('Stream')],
      'Stream',
      'SheepSeeker'
    ),
  RemoveStreamSheepSeeker: async (
    object: never,
    args: never,
    context: Context
  ) =>
    RemoveServant(
      context,
      args,
      [...permitAdmin('Stream')],
      'Stream',
      'SheepSeeker'
    ),
}

export default sheepSeekingMutations
