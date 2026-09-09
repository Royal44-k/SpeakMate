import { restaurantPacks } from './restaurant-order'
import { allergyPacks } from './food-allergy'
import { returnPacks } from './return-item'
import { supermarketPacks } from './supermarket-help'
import { pricePacks } from './price-discount'
import type { GradedPack } from '../schema'
import type { CefrLevel } from '@/domain/scenes/types'

export const remainingDiningPacks: Record<
  string,
  Record<CefrLevel, GradedPack>
> = {
  'dining-02': restaurantPacks,
  'dining-03': allergyPacks,
  'dining-04': returnPacks,
  'dining-05': supermarketPacks,
  'dining-06': pricePacks,
}
