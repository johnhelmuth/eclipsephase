
import {faker} from '@faker-js/faker'

export function randomSkillValue(min = 0) {
  return faker.number.int({min: min, max: 100})
}


export function randomRollMod() {
  return faker.number.int({min: -30, max: 30})
}

