
import {Builder, By, Key, Browser} from 'selenium-webdriver';

export async function ensureGameStarted() {

  const driver = await new Builder().forBrowser(Browser.CHROME).build();
  await driver.manage().setTimeouts({implicit: 500});

  let OKToJoin = false;

  try {

    await driver.get('http://localhost:30000/join');

    const title = await driver.getTitle();

    if (title === 'Critical Failure!') {
      const details = await driver.findElement(By.css('.error-details p')).getText();
      if (details === 'There is currently no active game session. Please wait for the host to configure the world and then refresh this page.') {

        await driver.get('http://localhost:30000/setup');

        const startWorld = await driver.findElement(By.css('#worlds #worlds-list :first-child .control.play'));

        startWorld.click();

        //TODO Wait for /join to be loaded... read up on waiting strategies here.

        // if /join is loaded and has the join game widgets
        OKToJoin = true;
      }
    } else {
      OKToJoin = true;
    }
  } finally {

    await driver.quit();
  }
  return OKToJoin;
}