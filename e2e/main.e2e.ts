import { expect } from 'chai';
import { join } from 'path';
import { SpectronClient } from 'spectron';

import commonSetup from './common-setup';

describe('ngrev', function () {

  commonSetup.apply(this);

  let client: SpectronClient;

  beforeEach(function() {
    client = this.app.client;
  });

  it('creates initial windows', async function () {
    const count = await client.getWindowCount();
    expect(count).to.equal(1);
  });

  it('should display a button saying "Select Project"', async function () {
    const elem = await client.$('ngrev-home button');
    const text = await elem.getText();
    expect(text).to.equal('Select Project');
  });

  it('should parse the project',async function() {
    const project = join(__dirname, '..', 'fixtures', 'ng-11', 'tsconfig.json');
    await this.app.electron.clipboard.writeText(project);
    await (await client.$('ngrev-home button')).click();
    const breadcrumbLabel = await client.$('ngrev-app h2');
    expect(await breadcrumbLabel.getText()).to.equal('History');
  });
});
