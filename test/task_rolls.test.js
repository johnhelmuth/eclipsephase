import * as dice from '../module/dice.js'
import * as help from './helpers.js'
import {expect} from 'chai';

describe('Task Rolls', () => {
  it('constructor', () => {
    let name = 'some task name'
    let value = 56
    let tr = new dice.TaskRoll(name, value)

    expect(tr.taskName).to.equal(name)
    expect(tr.baseValue).to.equal(value)
  })

  describe('totalTargetNumber', () => {
    it('with no mods', () => {
      const targetNumber = help.randomSkillValue()
      let roll = new dice.TaskRoll('some task name', targetNumber)

      expect(roll.totalTargetNumber).to.equal(targetNumber)
    })

    it('with mods', () => {
      const targetNumber = help.randomSkillValue()
      let roll = new dice.TaskRoll('some task name', targetNumber)
      let mods = [
        help.randomRollMod(),
        help.randomRollMod(),
        help.randomRollMod()
      ]
      let totalMods = mods[0] + mods[1] + mods[2]

      for(let mod of mods)
        roll.addModifier(new dice.TaskRollModifier('modifier', mod))

      expect(roll.totalTargetNumber).to.equal(targetNumber + totalMods)
    })
  })

  describe('_calculateResult', () => {
    describe('success results', () => {
      let roll

      beforeEach(() => {
        roll = new dice.TaskRoll('some task name', 70)
      })

      it('critical success', () => {
        roll._rollValue = 33
        roll._calculateResult()
        expect(roll.result).to.equal(dice.TASK_RESULT.CRITICAL_SUCCESS)
      })

      it('two degrees of success', () => {
        roll._rollValue = 67
        roll._calculateResult()
        expect(roll.result).to.equal(dice.TASK_RESULT.SUCCESS_TWO)
      })

      it('one degree of success', () => {
        roll._rollValue = 41
        roll._calculateResult()
        expect(roll.result).to.equal(dice.TASK_RESULT.SUCCESS_ONE)
      })

      it('regular  success', () => {
        roll._rollValue = 29 
        roll._calculateResult()
        expect(roll.result).to.equal(dice.TASK_RESULT.SUCCESS)
      })
    })

    describe('falure results', () => {
      let roll

      beforeEach(() => {
        roll = new dice.TaskRoll('some task name', 15)
      })

      it('critical falure', () => {
        roll._rollValue = 55
        roll._calculateResult()
        expect(roll.result).to.equal(dice.TASK_RESULT.CRITICAL_FAILURE)
      })

      it('two degrees of falure', () => {
        roll._rollValue = 29
        roll._calculateResult()
        expect(roll.result).to.equal(dice.TASK_RESULT.FAILURE_TWO)
      })

      it('one degree of falure', () => {
        roll._rollValue = 41
        roll._calculateResult()
        expect(roll.result).to.equal(dice.TASK_RESULT.FAILURE_ONE)
      })

      it('regular  falure', () => {
        roll._rollValue = 29
        roll._calculateResult()
        expect(roll.result).to.equal(dice.TASK_RESULT.FAILURE_TWO)
      })
    })
  })
})


describe('Task roll modifiers', () => {
  it('constructor', () => {
    let text = 'some descriptive text'
    let value = 2

    let mod = new dice.TaskRollModifier(text, value)

    expect(mod.text).to.equal(text)
    expect(mod.value).to.equal(value)

  })

  describe('Helpers', () => {
    describe('formattedValue', () => {
      it('positive value', () => {
        let trm = new dice.TaskRollModifier('some modifier', 10)
        expect(trm.formattedValue).to.equal('+10')
      })

      it('negative value', () => {
        let trm = new dice.TaskRollModifier('some modifier', -10)
        expect(trm.formattedValue).to.equal('-10')
      })

      it('zero value', () => {
        let trm = new dice.TaskRollModifier('some modifier', 0)
        expect(trm.formattedValue).to.equal('0')
      })
    })
  })
})


