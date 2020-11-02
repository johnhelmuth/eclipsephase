/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class EclipsePhaseActor extends Actor {

  /**
   * Augment the basic actor data with additional dynamic data.
   */
  prepareData() {
    super.prepareData();

    const actorData = this.data;
    const data = actorData.data;
    const flags = actorData.flags;

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    if (actorData.type === 'character') this._prepareCharacterData(actorData);

    //Physical & Mental derives
      data.physical.wt = Math.floor(data.bodies.morph1.dur / 5);
      if (data.bodyType.value === 'synth') {
          data.physical.dr = data.bodies.morph1.dur * 2;
      }
      else if (data.bodyType.value === 'bio'){
          data.physical.dr = data.bodies.morph1.dur * 1.5;
      }
      data.mental.luc = data.aptitudes.wil.value * 2;
      data.mental.ir = data.mental.luc * 2;
      data.mental.tt = Math.floor(data.mental.luc / 5);

    //Modificators
    data.mods.woundMod = (data.physical.wounds * 10);
    data.mods.traumaMod = (data.mental.trauma * 10);

    //Modifications

    //Special Skill Derives
      //data.specSkills.special1.specCheck = (data.specSkills.special1.value + parseInt(data.specSkills.special1.aptitude, 10));
      //data.specSkills.special2.specCheck = (data.specSkills.special2.value + parseInt(data.specSkills.special2.aptitude, 10));
      //data.specSkills.special3.specCheck = (data.specSkills.special3.value + parseInt(data.specSkills.special3.aptitude, 10));
      //data.specSkills.special4.specCheck = (data.specSkills.special4.value + parseInt(data.specSkills.special4.aptitude, 10));
      //data.specSkills.special5.specCheck = (data.specSkills.special5.value + parseInt(data.specSkills.special5.aptitude, 10));
      //data.specSkills.special6.specCheck = (data.specSkills.special6.value + parseInt(data.specSkills.special6.aptitude, 10));

    //Know Skill Derives
      //data.knowSkills.know1.knowCheck = (data.knowSkills.know1.value + parseInt(data.knowSkills.know1.aptitude, 10));
      //data.knowSkills.know2.knowCheck = (data.knowSkills.know2.value + parseInt(data.knowSkills.know2.aptitude, 10));
      //data.knowSkills.know3.knowCheck = (data.knowSkills.know3.value + parseInt(data.knowSkills.know3.aptitude, 10));
      //data.knowSkills.know4.knowCheck = (data.knowSkills.know4.value + parseInt(data.knowSkills.know4.aptitude, 10));
      //data.knowSkills.know5.knowCheck = (data.knowSkills.know5.value + parseInt(data.knowSkills.know5.aptitude, 10));
      //data.knowSkills.know6.knowCheck = (data.knowSkills.know6.value + parseInt(data.knowSkills.know6.aptitude, 10));
      //data.knowSkills.know7.knowCheck = (data.knowSkills.know7.value + parseInt(data.knowSkills.know7.aptitude, 10));
      //data.knowSkills.know8.knowCheck = (data.knowSkills.know8.value + parseInt(data.knowSkills.know8.aptitude, 10));
      //data.knowSkills.know9.knowCheck = (data.knowSkills.know9.value + parseInt(data.knowSkills.know9.aptitude, 10));
      //data.knowSkills.know10.knowCheck = (data.knowSkills.know10.value + parseInt(data.knowSkills.know10.aptitude, 10));

  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    const data = actorData.data;

    for (let [key, aptitude] of Object.entries(data.aptitudes)) {
        aptitude.mod = aptitude.value * 3;
        aptitude.roll = aptitude.mod - data.mods.woundMod - data.mods.traumaMod;
    }
    for (let [key, skill] of Object.entries(data.skillsIns)) {
      if(key === 'program' || key === 'interface' || key === 'infosec' ){
        skill.derived = skill.value + data.aptitudes.cog.value;
        skill.roll = skill.derived - data.mods.woundMod - data.mods.traumaMod;
        skill.specialized = skill.derived + 10 - data.mods.woundMod - data.mods.traumaMod;
      }
      else if (key === 'perceive') {
          skill.derived = skill.value + data.aptitudes.int.value * 2;
          skill.roll = skill.derived - data.mods.woundMod - data.mods.traumaMod;
          skill.specialized = skill.derived + 10 - data.mods.woundMod - data.mods.traumaMod;
      }
      else {
        skill.derived = skill.value + data.aptitudes.int.value;
        skill.roll = skill.derived - data.mods.woundMod - data.mods.traumaMod;
        skill.specialized = skill.derived + 10 - data.mods.woundMod - data.mods.traumaMod;
      }
    }
    for (let [key, skill] of Object.entries(data.skillsMox)) {
      if(key === 'provoke' || key === 'persuade' || key === 'kinesics' || key === 'deceive' ){
        skill.derived = skill.value + data.aptitudes.sav.value;
        skill.roll = skill.derived - data.mods.woundMod - data.mods.traumaMod;
        skill.specialized = skill.derived + 10 - data.mods.woundMod - data.mods.traumaMod;
      }
      else {
        skill.derived = skill.value + data.aptitudes.wil.value;
        skill.roll = skill.derived - data.mods.woundMod - data.mods.traumaMod;
        skill.specialized = skill.derived + 10 - data.mods.woundMod - data.mods.traumaMod;
      }
    }
    for (let [key, skill] of Object.entries(data.skillsVig)) {
      if(key === 'athletics' || key === 'free fall' || key === 'melee' ){
        skill.derived = skill.value + data.aptitudes.som.value;
        skill.roll = skill.derived - data.mods.woundMod - data.mods.traumaMod;
        skill.specialized = skill.derived + 10 - data.mods.woundMod - data.mods.traumaMod;
      }
      else if (key === 'fray'){
        skill.derived = (skill.value + data.aptitudes.ref.value * 2);
        skill.roll = skill.derived - data.mods.woundMod - data.mods.traumaMod;
        skill.specialized = skill.derived + 10 - data.mods.woundMod - data.mods.traumaMod;
      }
      else {
        skill.derived = skill.value + data.aptitudes.ref.value;
        skill.roll = skill.derived - data.mods.woundMod - data.mods.traumaMod;
        skill.specialized = skill.derived + 10 - data.mods.woundMod - data.mods.traumaMod;
      }
    }
    for (let [key, spec] of Object.entries(data.specSkills)) {
      spec.specCheck = (spec.value + parseInt(spec.aptitude, 10));
      spec.roll = spec.specCheck - data.mods.woundMod - data.mods.traumaMod;
    }
    for (let [key, know] of Object.entries(data.knowSkills)) {
      know.knowCheck = (know.value + parseInt(know.aptitude, 10));
      know.roll = know.knowCheck - data.mods.woundMod - data.mods.traumaMod;
    }
  }
}