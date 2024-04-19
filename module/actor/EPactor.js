import {eclipsephase} from "../config.js"

/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export default class EPactor extends Actor {

  static SKILL_DATA = [
    { skill: "athletics", aptitude: "som", multiplier: 1, category: "vigor" },
    { skill: "deceive", aptitude: "sav", multiplier: 1, category: "moxie" },
    { skill: "fray", aptitude: "ref", multiplier: 2, category: "vigor" },
    { skill: "free fall", aptitude: "som", multiplier: 1, category: "vigor" },
    { skill: "guns", aptitude: "ref", multiplier: 1, category: "vigor" },
    { skill: "infiltrate", aptitude: "ref", multiplier: 1, category: "vigor" },
    { skill: "infosec", aptitude: "cog", multiplier: 1, category: "insight" },
    { skill: "interface", aptitude: "cog", multiplier: 1, category: "insight" },
    { skill: "kinesics", aptitude: "sav", multiplier: 1, category: "moxie" },
    { skill: "melee", aptitude: "som", multiplier: 1, category: "vigor" },
    { skill: "perceive", aptitude: "int", multiplier: 2, category: "insight" },
    { skill: "persuade", aptitude: "sav", multiplier: 1, category: "moxie" },
    { skill: "program", aptitude: "cog", multiplier: 1, category: "insight" },
    { skill: "provoke", aptitude: "sav", multiplier: 1, category: "moxie" },
    { skill: "psi", aptitude: "wil", multiplier: 1, category: "moxie" },
    { skill: "research", aptitude: "int", multiplier: 1, category: "insight" },
    { skill: "survival", aptitude: "int", multiplier: 1, category: "insight" },
  ];

  /**
   * EPitem object for the actor's active Morph
   *
   * {EPitem}
   */
  _activeMorph;

  /**
   * ID of actor's active Morph object.
   */
  _activeMorphId;

  /**
   * Augment the basic actor data with additional dynamic data.
   */
  async prepareData() {
    super.prepareData();
    const actor = this;
    this._activeMorphId = this.system?.activeMorphId || ''; // Should only be '' between when a new actor is created and when the sheet.getData() method is called.
    const actorModel = this.system;
    const actorWhole = this;
    const flags = actorModel.flags;
    const items = this.items;
    let gammaCount = 0;
    let chiCount = 0;    
    let chiMultiplier = 1;
    if(actorWhole.type === "character" || actorWhole.type === "npc"){
      if (actorModel.psiStrain.infection >= 33){
        chiMultiplier = 2;
      }
    }
    actorModel.mods.psiMultiplier = chiMultiplier
    actorModel.currentStatus = [];

    // Homebrew Switch
    actorModel.homebrew = game.settings.get("eclipsephase", "superBrew");

    // Trust Mode
    actorModel.editAll = game.settings.get("eclipsephase", "editAll");

    if (game.user.isGM){

    }
    
    //Determin whether any gear is present
    if (this.hasMorph()) {
      actorModel.additionalSystems.hasGear = true;
    } else {
      for(let gearCheck of items){
        if(gearCheck.system.displayCategory === "ranged" || gearCheck.system.displayCategory === "ccweapon" || gearCheck.system.displayCategory === "gear" || gearCheck.system.displayCategory === "armor" || gearCheck.system.slotType === "consumable" || gearCheck.system.slotType === "digital"){
          actorModel.additionalSystems.hasGear = true;
          break;
        }
      }
    }

    //Determin whether any ammunition is present
    let ammoCount = 0;
    for (let item of items){
      if (item.type === "ammo")
      ammoCount++
    }
    if (ammoCount > 0){
      actorModel.additionalSystems.hasAmmo = true;
    }

    //Prepares information what type of psi a character uses
    for(let psiTypeCheck of items){
      if (psiTypeCheck.type === "aspect"){
        if(psiTypeCheck.system.psiType === "chi"){
          chiCount++
        }
        else if(psiTypeCheck.system.psiType === "gamma"){
          gammaCount++
        }
      }
    }

    let morph;
    let morphData;

    /** TODO refactor npcs and goons to have embedded morph items, then remove the following snippet. **/
    if (['npc','goon'].includes(this.type)) {
      morphData = this.system.bodies.morph1;
    } else {
      console.log('EPactor.prepareData() calling this.activeMorph()')
      morph = this.activeMorph;
      morphData = morph?.system ?? {};
    }
    console.log('EPactor.prepareData() morph: ', morph);
    console.log('EPactor.prepareData() morphData: ', morphData);
    this._calculatePhysicalHealth(actorModel, morphData, chiMultiplier);
    this._calculateArmor(actorModel, actorWhole);
    this._calculateInitiative(actorModel, chiMultiplier);

    actorModel.additionalSystems.movementBase = morphData?.movement1 ? morphData.movement1.base : 0;
    console.log('EPactor.prepareData() actorModel.additionalSystems.movementBase: ', actorModel.additionalSystems.movementBase);
    if (this.type === "character"){
      this._calculateMentalHealth(actorModel, chiMultiplier)
      this._calculateHomebrewEncumberance(actorModel);
      this._calculateSideCart(actorModel, items);
      this._poolUpdate(actorModel);
      this._modificationListCreator(actorModel, actorWhole, chiMultiplier);
    }
    if (this.type === "npc" || this.type === "character"){
      this._minimumInfection(actorModel, gammaCount, chiCount);
    }
    if (this.type === "npc" || this.type === "goon"){
    }

    // Aptitudes
    for (let [key, aptitude] of Object.entries(actorModel.aptitudes)) {
      aptitude.calc = aptitude.value * 3 + eval(aptitude.mod) + (aptitude.chiMod ? (eval(aptitude.chiMod)*chiMultiplier) : 0);
      aptitude.roll = aptitude.calc;
    }

    // Insight Skills
    for (let [key, skill] of Object.entries(actorModel.skillsIns)) {
      skill.mod = eval(skill.mod) + (skill.chiMod ? (eval(skill.chiMod)*chiMultiplier) : 0);
      this._calculateSkillValue(key,skill,actorModel,actorWhole.type);
    }

    // Moxie skills
    for (let [key, skill] of Object.entries(actorModel.skillsMox)) {
      skill.mod = eval(skill.mod) + (skill.chiMod ? (eval(skill.chiMod)*chiMultiplier) : 0);
      this._calculateSkillValue(key,skill,actorModel,this.type);
    }

    // Vigor skills
    for (let [key, skill] of Object.entries(actorModel.skillsVig)) {
      skill.mod = eval(skill.mod) + (skill.chiMod ? (eval(skill.chiMod)*chiMultiplier) : 0);
      this._calculateSkillValue(key,skill,actorModel,this.type);
    }

    //Pool Bonuses
    for (let [key, pool] of Object.entries(actorModel.pools)) {
      pool.mod = eval(pool.mod) + (pool.chiMod ? (eval(pool.chiMod)*chiMultiplier) : 0);
    }

    //Showing skill calculations for know/spec skills
    for (let value of items ) {
      let key = value.type;
      let aptSelect = 0;
      if (value.aptitude === "int") {
        aptSelect = actorModel.aptitudes.int.value;
      }
      else if (value.aptitude === "cog") {
        aptSelect = actorModel.aptitudes.cog.value;
      }
      else if (value.aptitude === "ref") {
        aptSelect = actorModel.aptitudes.ref.value;
      }
      else if (value.aptitude === "som") {
        aptSelect = actorModel.aptitudes.som.value;
      }
      else if (value.aptitude === "wil") {
        aptSelect = actorModel.aptitudes.wil.value;
      }
      else if (value.aptitude === "sav") {
        aptSelect = actorModel.aptitudes.sav.value;
      }
      else if (value.aptitude === "soft") {
        aptSelect = 0;
      }
      if(key === 'specialSkill' || key === 'knowSkill'){
        if(actorModel.type=="goon")
          value.roll = value.value?Number(value.value):aptSelect;
        else
          value.roll = (Number(value.value) + aptSelect)<100 ? Number(value.value) + aptSelect : 100;
      }
    }
  }

  /**
   * Getter for the active Morph Id.
   *
   * Using a getter here helps to ensure that `this.activeMorphId` isn't changed except when `this.system.activeMorphId` is changed.
   *
   * @returns {String}
   */
  get activeMorphId() {
    console.log('EPactor.activeMorphId: this.system.activeMorphId: ', this.system.activeMorphId)
    console.log('EPactor.activeMorphId: this._activeMorphId: ', this._activeMorphId)
    if (this.system.activeMorphId !== this._activeMorphId) {
      this._activeMorphId = this.system.activeMorphId;
    }
    return this._activeMorphId;
  }

  /**
   * Getter for the active Morph EPItem.
   *
   * @returns {EPitem|undefined}
   */
  get activeMorph() {
    console.log('EPactor activeMorph() this._activeMorphId: ', this._activeMorphId);
    console.log('EPactor activeMorph() this.system.activeMorphId: ', this.system.activeMorphId);
    console.log('EPactor activeMorph() this._activeMorph: ', this._activeMorph);
    console.log('EPactor activeMorph() this._activeMorph?._id: ', this._activeMorph?._id);

    if (this._activeMorphId && (! this._activeMorph || this._activeMorph?._id !== this._activeMorphId)) {
      console.log('EPactor activeMorph() out of sync, looking up this._activeMorphId morph.');
      this._activeMorph = this.getMorphById(this._activeMorphId);
    }

    console.log('EPactor activeMorph() this._activeMorph: ', this._activeMorph);
    return this._activeMorph;
  }

  /**
   * Gets an EPitem of type "morph" from the actors inventory, by ID.
   *
   * @param {String} morphId - the _id property of the morph to get.
   *
   * @returns {EPitem|undefined}
   */
  getMorphById(morphId) {
    const morph = this.items.find((item) => (item.type === "morph" && item._id === morphId));
    console.log('EPactor.getMorphById() morphId: ', morphId);
    console.log('EPactor.getMorphById() morph: ', morph);
    return morph;
  }

  /**
   * Getter for the list of EPitems of type "morph".
   *
   * @returns {EPitem[]} - NOTE: Could be an empty array.
   */
  get morphs() {
    const morphs = this.items.filter((item) => item.type === "morph") || [];
    console.log('EPactor getter morphs() morphs: ', morphs);
    return morphs;
  }

  /**
   * Does the actor have an active morph?
   *
   * Implies that morphs getter will return a non-empty array of morphs, and getMorphById() will return a morph.
   *
   * @returns {boolean}
   */
  hasMorph() {
    return !! this._activeMorphId;
  }

  /**
   * Creates a brand new empty EPitem of type "morph" in this actor's item collection.
   *
   * @returns {Promise<Epitem>}
   */
  async createMorph() {
    const newMorphName = game.i18n.localize('ep2e.morph.currentMorph.morphList.placeholder');
    const newMorphs = await this.createEmbeddedDocuments("Item", [{ type: "morph", name: newMorphName}], {render: true});
    return newMorphs[0];
  }

  /**
   * Switches the active Morph to another morph in the actor's inventory.
   *
   * This method ensures that the old morph's traits/flaws/ware's ActiveEffects are removed from the actor, and that
   * the new morph's traits/flaws/ware's ActiveEffects are added to the actor.
   *
   * @param {String} newMorphId - the _id of the morph to become the new active morph.
   *
   * @returns {Promise<EPitem>}
   */
  async switchMorph(newMorphId) {
    console.log('EPactor.switchMorph() newMorphId: ', newMorphId);
    const effUpdateData=[];
    //browses through ALL effects and identifies, whether they are bound to an item or not
    for (let effectScan of this.effects){
      if (effectScan.origin){

        /*Workaround fromUuid. Currently not needed - just in case fromUuid changes in the future/will become deactivated during an unstable dev release
        let Uuid = (effectScan.origin).split(".");
        let parentItem = actor.items.get(Uuid[3]);
        */

        let parentItem = await fromUuid(effectScan.origin)

        if (parentItem.system.boundTo){


          //If a found item is bound to the currently active morph it gets prepared to be activated
          if (parentItem.system.boundTo === newMorphId) {
            effUpdateData.push({
              "_id" : effectScan._id,
              disabled: false
            });
          }
          //If a found item is NOT bound to the currently active morph it gets prepared to be DEactivated
          else {
            effUpdateData.push({
              "_id" : effectScan._id,
              disabled: true
            });
          }
        }
      }
    }
    if (effUpdateData.length) {
      //This pushes the updated data into the effect
      await this.updateEmbeddedDocuments("ActiveEffect", effUpdateData);
    }
    return this.update({'system.activeMorphId': newMorphId}, {render: true});
  }

  /**
   * @inheritDoc
   *
   * Pulls active morph form data from actor sheet form data and applies it to the active Morph item.
   */
  async update(data={}, context={}) {
    console.log('EPactor.update() data: ', data);
    console.log('EPactor.update() context: ', context);
    const morphData = this.gatherActiveMorphDataFromForm(data);
    if (morphData) {
      console.log('EPactor.update() morphData: ', morphData);
      const activeMorphDocuments = [foundry.utils.mergeObject({_id: this.activeMorphId}, morphData)];
      console.log('EPactor.update() activeMorphDocuments: ', activeMorphDocuments);
      await this.updateEmbeddedDocuments("Item", activeMorphDocuments);
      // Do we need to remove the `activeMorph*` properties from the `data` object? I think they are discarded
      // by super classes update() function because the properties don't exist in the actor template/schema.
    }
    return super.update(data, context);
  }

  /**
   * Gathers active morph form data from submitted data on actor sheet.
   *
   * @param {*} data
   * @returns {*}
   */
  gatherActiveMorphDataFromForm(data) {
    const expandedData = foundry.utils.expandObject(data);
    console.log('EPactor.gatherActiveMorphDataFromForm() data: ', data);
    console.log('EPactor.gatherActiveMorphDataFromForm() expandedData: ', expandedData);
    return expandedData?.activeMorph;
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorModel) {
    // const data = actorModel.data;
  }

  _calculateInitiative(actorModel, chiMultiplier) {
    actorModel.initiative.value = Math.round((actorModel.aptitudes.ref.value + actorModel.aptitudes.int.value) / 5) + eval(actorModel.mods.iniMod) + (actorModel.mods.iniChiMod ? (eval(actorModel.mods.iniChiMod)*chiMultiplier) : 0) + eval(actorModel.mods.manualIniMod ? actorModel.mods.manualIniMod : 0)
    actorModel.initiative.display = "1d6 + " + (actorModel.initiative.value - eval(actorModel.mods.manualIniMod ? actorModel.mods.manualIniMod : 0))
  }

  _calculatePhysicalHealth(actorModel, morphData, chiMultiplier){
    
    //Calculating WT & DR

    const { dur: morphDur = 0, type: morphType = 'synth' } = morphData;

    //NPCs & Goons only
    if(this.type === 'npc' || this.type === 'goon') {
      actorModel.health.physical.max = (morphDur) + eval(actorModel.mods.durmod);
      actorModel.physical.wt = Math.round(actorModel.health.physical.max / 5);
      actorModel.physical.dr = Math.round(actorModel.health.physical.max * eclipsephase.damageRatingMultiplier[actorModel.bodyType.value]);
      actorModel.health.death.max = actorModel.physical.dr - actorModel.health.physical.max ? actorModel.physical.dr - actorModel.health.physical.max : 0;
      actorModel.health.death.value = actorModel.health.physical.value - actorModel.physical.dr

      if (actorModel.health.physical.value < actorModel.health.physical.max){
        actorModel.health.death.value = 0
      }
      else {
        actorModel.health.death.value = actorModel.health.physical.value - actorModel.health.physical.max
      }


      if(actorModel.health.physical.value === null) {
        actorModel.health.physical.value = 0
      }
      else if (actorModel.health.physical.value > actorModel.physical.dr){
        actorModel.health.physical.value = actorModel.physical.dr
      }
    }
    //Characters
    else{
      if(this.type === "character") {
        actorModel.health.physical.max = Number(morphDur) + eval(actorModel.mods.durmod) + (actorModel.mods.durChiMod ? (eval(actorModel.mods.durChiMod)*chiMultiplier) : 0) ? Number(morphDur) + eval(actorModel.mods.durmod) + (actorModel.mods.durChiMod ? (eval(actorModel.mods.durChiMod)*chiMultiplier) : 0) : 0;
        actorModel.physical.wt = Math.round(actorModel.health.physical.max / 5);
        actorModel.physical.dr = Math.round(actorModel.health.physical.max * Number(eclipsephase.damageRatingMultiplier[morphType])) ? Math.round(actorModel.health.physical.max * Number(eclipsephase.damageRatingMultiplier[morphType])) : 0;
        actorModel.health.death.max = actorModel.physical.dr - actorModel.health.physical.max ? actorModel.physical.dr - actorModel.health.physical.max : 0;
        actorModel.health.death.value = actorModel.health.physical.value - actorModel.physical.dr
        actorModel.bodyType.value = morphType;
  
        if (actorModel.health.physical.value < actorModel.health.physical.max){
          actorModel.health.death.value = 0
        }
        else {
          actorModel.health.death.value = actorModel.health.physical.value - actorModel.health.physical.max
        }
  
  
        if(actorModel.health.physical.value === null) {
          actorModel.health.physical.value = 0
        }
        else if (actorModel.health.physical.value > actorModel.physical.dr){
          actorModel.health.physical.value = actorModel.physical.dr
        }
  
        this._calculatePools(actorModel, morphData, chiMultiplier)
      }
    }
    
    //Health bar calculation
    let durabilityContainerWidth = 0
    let deathContainerWidth =  0

    const currentPhysicalDamage = actorModel.health.physical.value;
    const maxPhysicalDamage = actorModel.health.physical.max;
    actorModel.physical.relativePhysicalDamage = Math.round(currentPhysicalDamage*100/maxPhysicalDamage) > 100 ? 100 : Math.round(currentPhysicalDamage*100/maxPhysicalDamage);

    const currentDeathDamage = actorModel.health.death.value;
    const maxDeathDamage = actorModel.health.death.max;
    actorModel.physical.relativeDeathDamage = Math.round(currentDeathDamage*100/maxDeathDamage) > 100 ? 100 : Math.round(currentDeathDamage*100/maxDeathDamage);
    
    if(this.type === 'npc' || this.type === 'goon') {
      if(Number(eclipsephase.damageRatingMultiplier[actorModel.bodyType.value]) === 1.5){
        durabilityContainerWidth = 66.5;
        deathContainerWidth =  33.5;
      }
      else{
        durabilityContainerWidth = 50;
        deathContainerWidth =  50;
      }
    }
    else{
      if(Number(eclipsephase.damageRatingMultiplier[morphType]) === 1.5){
        durabilityContainerWidth = 66.5;
        deathContainerWidth =  33.5;
      }
      else{
        durabilityContainerWidth = 50;
        deathContainerWidth =  50;
      }
    }

    actorModel.physical.relativeDurabilityContainer = durabilityContainerWidth
    actorModel.physical.relativeDeathContainer = deathContainerWidth
  }

  _calculateMentalHealth(actorModel, chiMultiplier) {
    actorModel.health.mental.max = (actorModel.aptitudes.wil.value * 2) + eval(actorModel.mods.lucmod) + (actorModel.mods.lucChiMod ? (eval(actorModel.mods.lucChiMod)*chiMultiplier): 0);
    actorModel.mental.ir = actorModel.health.mental.max * 2;
    actorModel.mental.tt = Math.round(actorModel.health.mental.max / 5) + eval(actorModel.mods.ttMod) + (actorModel.mods.ttChiMod ? (eval(actorModel.mods.ttChiMod)*chiMultiplier) : 0);
    actorModel.health.insanity.max = actorModel.mental.ir - actorModel.health.mental.max;
    actorModel.health.insanity.value = actorModel.health.mental.value - actorModel.mental.ir;

      if (actorModel.health.mental.value < actorModel.health.mental.max){
        actorModel.health.insanity.value = 0
      }
      else {
        actorModel.health.insanity.value = actorModel.health.mental.value - actorModel.health.mental.max
      }


      if(actorModel.health.mental.value === null) {
        actorModel.health.mental.value = 0
      }
      else if (actorModel.health.mental.value > actorModel.mental.ir){
        actorModel.health.mental.value = actorModel.mental.ir
      }

    const currentPhysicalDamage = actorModel.health.mental.value;
    const maxPhysicalDamage = actorModel.health.mental.max;
    actorModel.mental.relativeStressDamage = Math.round(currentPhysicalDamage*100/maxPhysicalDamage) > 100 ? 100 : Math.round(currentPhysicalDamage*100/maxPhysicalDamage);

    const currentDeathDamage = actorModel.health.insanity.value;
    const maxDeathDamage = actorModel.health.insanity.max;
    actorModel.mental.relativeInsanityDamage = Math.round(currentDeathDamage*100/maxDeathDamage) > 100 ? 100 : Math.round(currentDeathDamage*100/maxDeathDamage);
  }

  _calculatePools(actorModel, morphData, chiMultiplier) {
    const {flex = 0, insight = 0, moxie = 0, vigor = 0} = morphData;
    console.log('EPactor._calculatePools() morphData: ', morphData);
    console.log('EPactor._calculatePools() flex: ', flex);
    console.log('EPactor._calculatePools() insight: ', insight);
    console.log('EPactor._calculatePools() moxie: ', moxie);
    console.log('EPactor._calculatePools() vigor: ', vigor);
    actorModel.pools.flex.totalFlex = Number(flex) +
      Number(actorModel.ego.egoFlex) +
      eval(actorModel.pools.flex.mod) + 
      (actorModel.pools.flex.chiMod ? (eval(actorModel.pools.flex.chiMod)*chiMultiplier) : 0)
    actorModel.pools.insight.totalInsight = Number(insight) +
      eval(actorModel.pools.insight.mod) + 
      (actorModel.pools.insight.chiMod ? (eval(actorModel.pools.insight.chiMod)*chiMultiplier) : 0)
    actorModel.pools.moxie.totalMoxie = Number(moxie) +
      eval(actorModel.pools.moxie.mod) + 
      (actorModel.pools.moxie.chiMod ? (eval(actorModel.pools.moxie.chiMod)*chiMultiplier) : 0)
    actorModel.pools.vigor.totalVigor = Number(vigor) +
      eval(actorModel.pools.vigor.mod) + 
      (actorModel.pools.vigor.chiMod ? (eval(actorModel.pools.vigor.chiMod)*chiMultiplier) : 0)
  }

  _calculateHomebrewEncumberance(actorModel) {
   //HOMEBREW - Encumbrance through weapons & gear
   if(actorModel.homebrew === true && this.type === "character"){
    //Weapon Variables
    let weaponScore = 0;
    let weaponScoreMod = actorModel.mods.weaponScoreMod ? eval(actorModel.mods.weaponScoreMod) : 0;
    let bulkyWeaponCount = 0;
    let weaponMalus = 0;
    let weaponItems = this.items.filter(i => i.type === "rangedWeapon" || i.type === "ccWeapon");
    //Gear Variables
    let gearItems = this.items.filter(i => i.type === "gear");
    let accessoryCount = 0;
    let accessoryCountMod = actorModel.mods.accessoryCountMod ? eval(actorModel.mods.accessoryCountMod) : 0;
    let accessoryMalus = 0;
    let bulkyCount = 0;
    let bulkyCountMod = actorModel.mods.bulkyCountMod ? eval(actorModel.mods.bulkyCountMod) : 0;
    let bulkyMalus = 0;
    //Consumable Encumberance
    let consumableItems = this.items.filter(i => i.system.slotType === "consumable");
    let consumableCount = 0;
    let consumableCountMod = actorModel.mods.consumableCountMod ? eval(actorModel.mods.consumableCountMod) : 0;
    let consumableMalus = 0;
    //Weapon loop
    for(let weaponCheck of weaponItems){
        if(weaponCheck.system.active && weaponCheck.system.slotType === "sidearm"){
          weaponScore++;
        } 
        else if(weaponCheck.system.active && weaponCheck.system.slotType === "oneHanded"){
          weaponScore += 2;
        }
        else if(weaponCheck.system.active && weaponCheck.system.slotType === "twoHanded"){
          weaponScore += 4;
        }
        else if(weaponCheck.system.active && weaponCheck.system.slotType === "bulky"){
          bulkyWeaponCount++;
        }
    }
    //Gear loop
    for(let gearCheck of gearItems){
      if(gearCheck.system.active && gearCheck.system.slotType === "accessory"){
        for(let i=0; i<gearCheck.system.quantity; i++){
          accessoryCount++;
        }
      }
      else if(gearCheck.system.active && gearCheck.system.slotType === "bulky"){
        for(let i=0; i<gearCheck.system.quantity; i++){
          bulkyCount++;
        }
      }
    }
    //Consumable loop
    for(let consumCheck of consumableItems){
      if (consumCheck.system.active){
        for(let i=0; i<consumCheck.system.quantity; i++){
          consumableCount++;
        }
      }
    }
    //Modification Calculator
    if(accessoryCount + accessoryCountMod > 4){
      accessoryMalus = Math.ceil((accessoryCount + accessoryCountMod -4)/4)*10;
    }
    if(weaponScore + weaponScoreMod > 5){
      weaponMalus = (Math.ceil((weaponScore + weaponScoreMod -5)/5)*10);
    }
    if(bulkyCount + bulkyWeaponCount + bulkyCountMod >= 1){
      bulkyMalus = (bulkyCount + bulkyWeaponCount + bulkyCountMod)*20;
    }
    if(consumableCount + consumableCountMod > 3){
      consumableMalus = Math.ceil((consumableCount + consumableCountMod -3)/3)*10;
    }

    actorModel.physical.totalWeaponMalus = weaponMalus;
    actorModel.physical.totalGearMalus = bulkyMalus + accessoryMalus + consumableMalus;
    actorModel.currentStatus.bulkyModifier = bulkyMalus;
    actorModel.currentStatus.gearModifier = accessoryMalus;
    actorModel.currentStatus.consumableModifier = consumableMalus;
  }
  //In case "Homebrew" is ticked off, this prevents a NaN failure in the dice roll
  else {
    actorModel.physical.totalWeaponMalus = 0;
    actorModel.physical.totalGearMalus = 0;
  }
  }

  _calculateSideCart(actorModel, items) {
    //Checks for certain item types to be equipped to dynamically change the side cart content
    let rangedCount = 0;
    let ccCount = 0;
    let armorCount = 0;
    let gearCount = 0;
    let consumableCount = 0;

    actorModel.additionalSystems.rangedEquipped = false;
    actorModel.additionalSystems.ccEquipped = false;
    actorModel.additionalSystems.armorEquipped = false;
    actorModel.additionalSystems.gearEquipped = false;
    actorModel.additionalSystems.consumableEquipped = false;

    for(let gearCheck of items){
      if(gearCheck.system.displayCategory === "ranged" && gearCheck.system.active){
        rangedCount++
      }
      else if(gearCheck.system.displayCategory === "ccweapon" && gearCheck.system.active){
        ccCount++
      }
      else if(gearCheck.system.displayCategory === "armor" && gearCheck.system.active){
        armorCount++
      }
      else if(gearCheck.system.displayCategory === "gear" && gearCheck.system.active && gearCheck.system.slotType != "consumable"){
        gearCount++
      }
      else if(gearCheck.system.slotType === "consumable" && gearCheck.system.active){
        consumableCount++
      }
    }
    if(rangedCount>0){
      actorModel.additionalSystems.rangedEquipped = true;
    }
    if(ccCount>0){
      actorModel.additionalSystems.ccEquipped = true;
    }
    if(armorCount>0){
      actorModel.additionalSystems.armorEquipped = true;
    }
    if(gearCount>0){
      actorModel.additionalSystems.gearEquipped = true;
    }
    if(consumableCount>0){
      actorModel.additionalSystems.consumableEquipped = true;
    }
  }

  _poolUpdate(actorModel) {
    actorModel.pools.update.possible = true;
    let insightUpdate = actorModel.pools.update.insight;
    let vigorUpdate = actorModel.pools.update.vigor;
    let moxieUpdate = actorModel.pools.update.moxie;
    let flexUpdate = actorModel.pools.update.flex;
    const curInsight = actorModel.pools.insight.value;
    const curVigor = actorModel.pools.vigor.value;
    const curMoxie = actorModel.pools.moxie.value;
    const curFlex = actorModel.pools.flex.value;
    const maxInsight = actorModel.pools.insight.totalInsight;
    const maxVigor = actorModel.pools.vigor.totalVigor;
    const maxMoxie = actorModel.pools.moxie.totalMoxie;
    const maxFlex = actorModel.pools.flex.totalFlex;
    const restValue = actorModel.rest.restValue;
    const updateTotal = insightUpdate + vigorUpdate + moxieUpdate + flexUpdate;
    restValue ? actorModel.rest.restValueUpdate = restValue - updateTotal : 0;
    const restValueUpdate = actorModel.rest.restValueUpdate;

    if (insightUpdate + curInsight > maxInsight){
      insightUpdate = maxInsight - curInsight;
      return this.update({"system.pools.update.insight" : insightUpdate});
    }
    if (vigorUpdate + curVigor > maxVigor){
      vigorUpdate = maxVigor - curVigor;
      return this.update({"system.pools.update.vigor" : vigorUpdate});
    }
    if (moxieUpdate + curMoxie > maxMoxie){
      moxieUpdate = maxMoxie - curMoxie;
      return this.update({"system.pools.update.moxie" : moxieUpdate});
    }
    if (flexUpdate + curFlex > maxFlex){
      flexUpdate = maxFlex - curFlex;
      return this.update({"system.pools.update.flex" : flexUpdate});
    }

    if (restValueUpdate === 0){
      actorModel.pools.update.possible = 0;
    }
    if (restValueUpdate < 0){
      actorModel.pools.update.possible = 2;
    }
    if (restValueUpdate > 0){
      actorModel.pools.update.possible = 1;
    }
  }

  _modificationListCreator(actorModel, actorWhole, chiMultiplier){
    //Wounds + wound mods are getting calculated
    let wounds = actorModel.physical.wounds
    let ignoreWounds = actorModel.mods.woundMod + (actorModel.mods.woundChiMod ? (eval(actorModel.mods.woundChiMod)*chiMultiplier) : 0)
    let woundsCalc = wounds + ignoreWounds > 0 ? (wounds + ignoreWounds) * -10 * actorModel.mods.woundMultiplier : 0;

    //Trauma + trauma mods are getting calculated
    let trauma = actorModel.mental.trauma;
    let ignoreTrauma = actorModel.mods.traumaMod + (actorModel.mods.traumaChiMod ? (eval(actorModel.mods.traumaChiMod)*chiMultiplier) : 0)
    let traumaCalc = trauma + ignoreTrauma > 0 ? (trauma + ignoreTrauma) * -10 : 0;

    //Armor & bulky are getting calculated
    let armorEncumberance = actorModel.physical.mainArmorMalus;
    let numberOfLayers = armorEncumberance/20+1;
    let armorSomCumberance = actorModel.physical.armorSomMalus;
    let bulky = actorModel.currentStatus.bulkyModifier;

    //Encumberance(Homebrew) gets calculated
    let weapon = actorModel.physical.totalWeaponMalus;
    let gear = actorModel.currentStatus.gearModifier;
    let consumable = actorModel.currentStatus.consumableModifier;

    actorModel.currentStatus.generalModifier = false;
    actorModel.currentStatus.generalModifierSum = 0;
    actorModel.currentStatus.woundModifierSum = 0;
    actorModel.currentStatus.ignoreWound = ignoreWounds*(-1);
    actorModel.currentStatus.ignoreTrauma = ignoreTrauma*(-1);
    actorModel.currentStatus.traumaModifierSum = 0;
    actorModel.currentStatus.armorModifier = false;
    actorModel.currentStatus.armorModifierSum = 0;
    actorModel.currentStatus.armorLayerSum = 0;
    actorModel.currentStatus.encumberanceModifier = false;
    actorModel.currentStatus.encumberanceModifierSum = 0;
    actorModel.currentStatus.statusPresent = false

    if(wounds > 0 || trauma > 0){
      actorModel.currentStatus.generalModifier = true;
      actorModel.currentStatus.woundModifierSum = woundsCalc;
      actorModel.currentStatus.traumaModifierSum = traumaCalc;
      actorModel.currentStatus.generalModifierSum = woundsCalc + traumaCalc;
    }
    
    if(armorEncumberance || armorSomCumberance){
      actorModel.currentStatus.armorModifier = true;
      actorModel.currentStatus.armorLayerSum = numberOfLayers
      actorModel.currentStatus.armorModifierSum = (armorEncumberance + armorSomCumberance)*-1;
    }

    if (actorModel.homebrew){
      if(bulky || weapon || gear || consumable){
        actorModel.currentStatus.encumberanceModifier = true;
        actorModel.currentStatus.bulkySum = bulky/20;
        actorModel.currentStatus.encumberanceModifierSum = (bulky + weapon + gear + consumable)*-1;
      }
    }

    if(actorModel.currentStatus.generalModifier || actorModel.currentStatus.generalModifier || actorModel.currentStatus.armorModifier || actorModel.currentStatus.encumberanceModifier){
      actorModel.currentStatus.statusPresent = true
    }

    actorModel.currentStatus.currentModifiersSum = actorModel.currentStatus.generalModifierSum + actorModel.currentStatus.armorModifierSum + actorModel.currentStatus.encumberanceModifierSum;
  }

  _calculateArmor(actorModel, actorWhole) {
    let energyTotal = 0;
    let kineticTotal = 0;
    let mainArmorAmount = 0;
    let additionalArmorAmount = 0;
    let armorSomCheck = null;
    let actorSom = actorModel.aptitudes.som.value;

    let armorItems = this.items.filter(i => i.type === "armor")

    for (let armor of armorItems) {
      let key = armor.type
      if(armor.system.active){
        energyTotal += Number(armor.system.energy)
        kineticTotal += Number(armor.system.kinetic)
        if (armor.system.slotType === "main") {
          mainArmorAmount++
        }
      }
    }

    actorModel.physical.energyArmorTotal = energyTotal + eval(actorModel.mods.energyMod);
    actorModel.physical.kineticArmorTotal = kineticTotal + eval(actorModel.mods.kineticMod);
    actorModel.physical.mainArmorTotal = mainArmorAmount;
    actorModel.physical.additionalArmorTotal = additionalArmorAmount;
    actorModel.physical.mainArmorMalus = 0;
    actorModel.physical.additionalArmorMalus = 0;
    actorModel.physical.armorMalusTotal = 0;
    actorModel.physical.armorSomMalus = 0;
    actorModel.physical.armorDurAnnounce = "";

    if (mainArmorAmount > 1) {
      actorModel.physical.mainArmorMalus = (mainArmorAmount - 1)*20;
    }

    if (actorModel.physical.energyArmorTotal > actorModel.physical.kineticArmorTotal){
      armorSomCheck = actorModel.physical.energyArmorTotal;
    }
    else {
      armorSomCheck = actorModel.physical.kineticArmorTotal;
    }

    //Homebrew for SOM armor malus
    if (actorWhole.type === "character" && armorSomCheck > actorSom && actorModel.homebrew){
      actorModel.physical.armorSomMalus = 20;
    }
    else if (actorWhole.type === "character" && armorSomCheck > actorSom && mainArmorAmount > 1){
      actorModel.physical.armorSomMalus = 20;
    }

    actorModel.physical.armorMalusTotal = actorModel.physical.mainArmorMalus+actorModel.physical.armorSomMalus;

    if (actorModel.health.physical.max < armorSomCheck){
      actorModel.physical.armorDurAnnounce = 1;
    }

    if (armorSomCheck > 11){
      actorModel.physical.armorVisibilityAnnounce = 1;
    }
  }

  _calculateSkillValue(key, skill, data, actorType) {
    let skillData = EPactor.SKILL_DATA.find(element => element.skill == key)
    let skillValue = data.aptitudes[skillData.aptitude].value
    let skillCap = 100 + Number(skill.capMod ? skill.capMod : 0)
    skill.total = skill.value + skillValue * skillData.multiplier;

    if(actorType === 'character' || actorType === 'npc')
      skill.derived =  (skill.total < skillCap ? skill.total : skillCap) + Number(skill.mod);
    else
      skill.derived = skill.value + Number(skill.mod)

    skill.roll = Number(skill.derived)
    skill.specialized = skill.roll + 10
  }

  _minimumInfection(actorModel, gammaCount, chiCount) {

    let minimumInfection = 0;
    let currentInfection = actorModel.psiStrain.infection;

    if (gammaCount > 0){
      minimumInfection = 20
    }
    else if (chiCount > 0){
      minimumInfection = 10
    }
    
    if (currentInfection < minimumInfection){
      actorModel.psiStrain.infection = minimumInfection;
    }

    actorModel.psiStrain.minimumInfection = minimumInfection
  }

  async _autoPush(actorModel, actorWhole) {
    let currentInfection = actorModel.psiStrain.infection;
    let autoPushSelection = actorModel.additionalSystems.autoPushSelection

    switch(currentInfection){
      case (currentInfection < 33):
        actorModel.additionalSystems.autoPush = 0;
        actorModel.additionalSystems.autoPushSelection = false;
        break;
      case (currentInfection > 66 && !autoPushSelection):
        actorModel.additionalSystems.autoPush = 2;
        let pushSelection = await autoPushSelector("selectAutoPush")
        let selection = pushSelection.pushType;
        actorModel.additionalSystems.autoPushSelection = selection;

        break;
      default:
        break;
    }
  }
}

async function autoPushSelector(dialogType) {
  let dialog = 'systems/eclipsephase/templates/chat/pop-up.html';
  let dialogName = game.i18n.localize('ep2e.actorSheet.dialogHeadline.confirmationNeeded');
  let selectButton = game.i18n.localize('ep2e.actorSheet.button.select');
  const html = await renderTemplate(dialog, {dialogType});

  return new Promise(resolve => {
      const data = {
          title: dialogName,
          content: html,
          buttons: {
              normal: {
                  label: selectButton,
                  callback: html => resolve(_autoPushSelection(html[0].querySelector("form")))
              }
          },
          default: "normal",
          close: () => resolve ({cancelled: true})
      };
      let options = {width:315}
      new Dialog(data, options).render(true);
  });
}

//General skill check results
function _autoPushSelection(form) {
    return {
        pushType: form.autoPush ? form.autoPush.value : false
    }
}
