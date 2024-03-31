
import {Builder, By, Key, Browser} from 'selenium-webdriver';
import {expect} from 'chai';
import ensureGameStarted from 'libs/ensure-game-started.js';

describe("Management pages", function() {
  let driver;
  this.timeout(5000);

  if (! ensureGameStarted()) {
    throw new Error('Foundry VTT Game is not started.');
  }

  beforeEach(async function() {
    driver = await new Builder().forBrowser(Browser.CHROME).build();
    await driver.manage().setTimeouts({implicit: 500});
  });

  describe("Join Page", function() {

    beforeEach(async function() {
      await driver.get('http://localhost:30000/join');
    })

    it("Title should be EP Test", async function () {
      const title = await driver.getTitle();
      expect(title).to.equal('EP Test');
    });

    it("Join Game Section header", async function() {
      await driver.get('http://localhost:30000/join');
      const joinHeader = await driver.findElement(By.css('form#join-game h2')).getText();
      expect(joinHeader).to.equal('Join Game Session');
    });

  });

});

