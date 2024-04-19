import {eclipsephase} from '../../config.js';

const fields = foundry.data.fields;

export default class EPmorphModel extends foundry.abstract.TypeDataModel {

  static defineSchema() {

    const bodyTypes = Object.keys(eclipsephase.bodyTypes);
    const costTypes = Object.keys(eclipsephase.costTypes);

    const morphSchema = {

      // From Item "base" template
      additionalSystems: new fields.ObjectField({required: false, blank: true}),
      description: new fields.HTMLField({required: false, blank: true}),
      active: new fields.BooleanField({required: false, blank: true, initial: true}),
      updated: new fields.StringField({required: true, blank: true}),

      // "cost" only from Item "buyable" template
      cost: new fields.StringField({required: true, initial: costTypes[0], choices: costTypes, blank: false}),

      // Remaining fields for morph, sans traits and flaws.
      // TODO: This is how to do the icon for the img, but that's already defined in the Item class.
      // img: new fields.FilePathField({required: false, categories: ["IMAGE"], initial: 'systems/eclipsephase/resources/img/anObjectificationByMichaelSilverRIP.jpg'}),
      type: new fields.StringField({required: true, initial: bodyTypes[0], choices: bodyTypes, blank: false}),
      dur: new fields.NumberField({required: true, integer: true, positive: true, initial: 1, min: 1 }),
      insight: new fields.NumberField({required: true, integer: true, initial: 0}),
      moxie: new fields.NumberField({required: true, integer: true, initial: 0}),
      vigor: new fields.NumberField({required: true, integer: true, initial: 0}),
      flex: new fields.NumberField({required: true, integer: true, initial: 0}),
      movement1: this.movementTypeSchema(fields),
      movement2: this.movementTypeSchema(fields),
      movement3: this.movementTypeSchema(fields),

      // TODO add Traits and Flaws
    };

    console.log('EPmorphModel.defineSchema() morphSchema: ', morphSchema);

    return morphSchema;
  }

  static movementTypeSchema() {
    const movementTypes = Object.keys(eclipsephase.moveTypes);
    return new fields.SchemaField({
      type: new fields.StringField({required: true, initial: movementTypes[0], choices: movementTypes, blank: false}),
      base: new fields.NumberField({required: true, integer: true, initial: 0}),
      full: new fields.NumberField({required: true, integer: true, initial: 0}),
    });
  }

  get displayCategory() { return 'morph'; }

  get bodyTypeLabel() {
    return game.i18n.localize(eclipsephase.bodyTypes[this.type]);
  }

  // TODO Add getter methods for Traits and Flaws
}