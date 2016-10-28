import { IonicHelloWorldPage } from './app.po';

describe('ionic-hello-world App', function() {
  let page: IonicHelloWorldPage;

  beforeEach(() => {
    page = new IonicHelloWorldPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
