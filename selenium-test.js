
import {Builder, By, Key, until} from 'selenium-webdriver';
import assert from 'assert';

describe("webdriver search top result", function() {
  test("should be 'Selenium'", async function () {

    const driver = await new Builder().forBrowser('chrome').build();

    await driver.get('http://www.google.com/');

    await driver.findElement(By.name('q')).sendKeys('webdriver', Key.RETURN);

    const first_header = await driver.findElement(By.css('.VuuXrf')).getText();
    assert.strictEqual(first_header, "Selenium");
    console.log("TEST PASSED");
  })
});

