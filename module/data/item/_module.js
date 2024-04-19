import EPmorphModel from "./EPmorphModel.js";

/**
 * TypeDataModel overrides for Item types.
 *
 * This is set up this way to make it easy to expand the subtype data modeling to other subtypes,
 * like Item weapons or Actors npcs or goons.
 *
 * @type {{morph: EPmorphModel}}
 */
export const dataModels = {
  Item: {
    morph: EPmorphModel,
  }
}