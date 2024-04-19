export default class EPitem extends Item {

    async _preCreate(data, options, user) {
        console.log('EPitem._preCreate() data: ', data);
        console.log('EPitem._preCreate() options: ', options);
        console.log('EPitem._preCreate() user: ', user);
        return super._preCreate(data, options, user);
    }


    async _preUpdate(changed, options, user) {
        console.log('EPitem._preUpdate() changed: ', changed);
        console.log('EPitem._preUpdate() options: ', options);
        console.log('EPitem._preUpdate() user: ', user);
        return super._preUpdate(changed, options, user);
    }

    async prepareData() {
        super.prepareData();
        
        const brewStatus = game.settings.get("eclipsephase", "superBrew");
        const item = this;
        const itemModel = item.system;
    
        // Homebrew Switch
        if (brewStatus) {
          itemModel.homebrew = true;
        }
        else {
          itemModel.homebrew = false;
        }

        // if (itemModel.img !== this.img) {
        //     this.img = itemModel.img;
        // }
      }

    chatTemplate = {
        "rangedWeapon": "systems/eclipsephase/templates/actor/partials/item-partials/ranged-weapons.html",
        "ccWeapon": "systems/eclipsephase/templates/actor/partials/item-partials/cc-weapons.html",
        "gear": "systems/eclipsephase/templates/actor/partials/item-partials/gear.html"
    };

    async roll() {
        let chatData = {
            user: game.user._id,
            speaker: ChatMessage.getSpeaker()
        };

        let cardData = {
            ...this.system,
            owner: this.actor.id
        };

        chatData.content = await renderTemplate(this.chatTemplate[this.type], cardData);

        chatData.roll = true;

        return ChatMessage.create(chatData);
    }

    /** @inheritDoc **/
    static getDefaultArtwork(itemData) {
        return {
            img: (CONFIG.eclipsephase.itemsDefaultArtwork?.[itemData?.type] ?? this.DEFAULT_ICON)
        };
    }
}