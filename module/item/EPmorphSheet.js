
export default class EPmorphSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["eclipsephase", "sheet", "item"],
      resizable: false,
      width: 700,
      height: 850,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".item-sheet-body", initial: "description" }]
    });
  }

  /** @override */
  get template() {
    const path = "systems/eclipsephase/templates/item";
    return `${path}/item-${this.item.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const sheetData = super.getData()
    sheetData.config = CONFIG.eclipsephase

    console.log("***** morph-sheet")
    console.log(sheetData)
    // TODO: include morph cost?
    return sheetData
  }

  /* -------------------------------------------- */

  /** @override
   setPosition(options = {}) {
    const position = super.setPosition(options);
    const sheetBody = this.element.find(".item-sheet-body");
    const bodyHeight = position.height - 192;
    sheetBody.css("height", bodyHeight);
    return position;
  }

   /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Roll handlers, click handlers, etc. would go here.
  }

  // Drag & Drop handlers would go here for Traits and Flaws, `async _onDropEvent(event)`
}